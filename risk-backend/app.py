from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Query
from typing import List
from typing import Optional
import pandas as pd
import numpy as np
import os
import uvicorn
import requests
from functools import lru_cache

app = FastAPI()


# -------------------------------
# CORS
# -------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_PATH = "D:/Big Data Project/Risk_Frontend_Data"
REVIEW_BASE_PATH = "D:/Big Data Project/processed"
GOOGLE_MAPS_BASE_URL = "https://www.google.com/maps?cid="



# BUILD STATE-YEAR INDEX ON STARTUP (NO MORE DISK SCAN)

STATE_YEAR_INDEX = {}

def build_state_index():
    for folder in os.listdir(BASE_PATH):
        if folder.startswith("state="):
            state = folder.replace("state=", "")
            state_path = os.path.join(BASE_PATH, folder)

            years = []
            for sub in os.listdir(state_path):
                if sub.startswith("year="):
                    year = int(sub.replace("year=", ""))
                    years.append(year)

            STATE_YEAR_INDEX[state] = sorted(years)

build_state_index()

#  PARQUET CACHE (SUPER IMPORTANT)

@lru_cache(maxsize=200)
def load_parquet_cached(path: str, columns: tuple):
    return pd.read_parquet(path, columns=list(columns))

# LOCAL LLM CALL (OLLAMA)

def call_local_llm(prompt: str):
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3",
                "prompt": prompt,
                "stream": False
            },
            timeout=180
        )

        return response.json()["response"]

    except Exception as e:
        return f"LLM Error: {str(e)}"
    

# ROOT
@app.get("/")
def root():
    return {"message": "Ultra Performance Risk Backend Running 🚀"}

# STATES
@app.get("/states")
def get_states():
    return {"states": sorted(STATE_YEAR_INDEX.keys())}


# YEARS
@app.get("/years")
def get_years(state: str):
    return {"years": STATE_YEAR_INDEX.get(state, [])}

# OVERVIEW (OPTIMIZED)
@app.get("/overview")
def get_overview(state: str, year: int):

    if state not in STATE_YEAR_INDEX:
        return {"counts": {"low": 0, "medium": 0, "high": 0}, "top_high_risk": []}

    year_path = os.path.join(BASE_PATH, f"state={state}", f"year={year}")

    df = load_parquet_cached(
        year_path,
        ("prediction", "probability", "name", "risk_label")
    )

    if df.empty:
        return {"counts": {"low": 0, "medium": 0, "high": 0}, "top_high_risk": []}

    low_count = (df["prediction"] == 0).sum()
    medium_count = (df["prediction"] == 1).sum()
    high_count = (df["prediction"] == 2).sum()

    high_df = df[df["prediction"] == 2]

    if not high_df.empty:
        high_probs = high_df["probability"].apply(
            lambda x: float(x["values"][2]) if isinstance(x, dict) else float(x[2])
        )
        high_df = high_df.assign(high_prob=high_probs)

        top_high = (
            high_df.sort_values("high_prob", ascending=False)
            .head(10)[["name", "risk_label", "high_prob"]]
            .to_dict(orient="records")
        )
    else:
        top_high = []

    return {
        "counts": {
            "low": int(low_count),
            "medium": int(medium_count),
            "high": int(high_count)
        },
        "top_high_risk": top_high
    }
    
# NEW: AI RISK EXPLANATION (LOCAL LLM)
@app.post("/year-risk-explanation")
def get_year_risk_explanation(payload: dict):

    state = payload["state"]
    year = payload["year"]
    gmap_id = payload["gmap_id"]

    low = payload["low"]
    medium = payload["medium"]
    high = payload["high"]
    total_reviews = payload["total_reviews"]
    negative_ratio = payload["negative_review_ratio"]
    risk_label = payload["risk_label"]
    avg_sentiment_score = payload["avg_sentiment_score"]

    # LOAD REVIEW DATA (TEXT)
    review_path = os.path.join(
    REVIEW_BASE_PATH,
    f"state={state}",
    f"year={year}"
    )


    if not os.path.exists(review_path):
        return {"explanation": "Review data not available."}

    df_reviews = pd.read_parquet(
        review_path,
        columns=["gmap_id", "rating", "text"]
    )

    df_business = df_reviews[
        (df_reviews["gmap_id"] == gmap_id) 
    ]

    # Identify negative reviews
    negative_reviews = df_business[df_business["rating"] <= 2]["text"].dropna().head(6)
    positive_reviews = df_business[df_business["rating"] >= 4]["text"].dropna().head(6)

    if risk_label == "HIGH":
        reviews_to_use = negative_reviews
    else:
        reviews_to_use = negative_reviews + positive_reviews
    
    review_block = "\n".join([f"- {r}" for r in reviews_to_use])

  
  # Ensure all variables are defined before this block
    prompt = f"""
You are explaining the result of a business risk assessment in simple, non-technical language.

For Year {year}, the business was classified as {risk_label} risk.

Customer Review Excerpts:
{review_block}

Instructions:

1. Analyze the reviews provided above.
2. If the classification is HIGH, focus only on recurring complaints and negative experiences.
3. If the classification is LOW, focus on consistent positive experiences and describe complaints as minor or isolated.
4. If the classification is MEDIUM, describe the mixed pattern of praise and concerns.
5. Do NOT mention probabilities, scores, ratios, or any numerical values.
6. Do NOT use technical terms like sentiment score or metrics.
7. Write in a way that a non-technical person can understand.
8. Keep the explanation under 100 words.
9. Provide only clean bullet points (6–8 bullets max).
   Do NOT add any introductory sentence, explanation line, heading, or concluding sentence.
   Output must start directly with a bullet point.
"""

    explanation = call_local_llm(prompt)

    return {"explanation": explanation}

# CUSTOMER METRICS (OPTIMIZED)
@app.get("/customer-metrics")
def get_customer_metrics(state: str, year: int):

    year_path = os.path.join(BASE_PATH, f"state={state}", f"year={year}")

    df = load_parquet_cached(
        year_path,
        (
            "avg_user_rating",
            "avg_sentiment_score",
            "negative_review_ratio",
            "yearly_negative_trend",
            "rating_sentiment_gap"
        )
    )

    if df.empty:
        return {
            "avg_rating": 0,
            "avg_sentiment": 0,
            "negative_ratio": 0,
            "negative_trend": 0,
            "gap": 0
        }

    return {
        "avg_rating": float(df["avg_user_rating"].mean()),
        "avg_sentiment": float(df["avg_sentiment_score"].mean()),
        "negative_ratio": float(df["negative_review_ratio"].mean()),
        "negative_trend": float(df["yearly_negative_trend"].mean()),
        "gap": float(df["rating_sentiment_gap"].mean())
    }

# CUSTOMER TREND (OPTIMIZED)
@app.get("/customer-trend")
def get_customer_trend(state: str):

    years = STATE_YEAR_INDEX.get(state, [])
    trend = []

    for year in years:
        year_path = os.path.join(BASE_PATH, f"state={state}", f"year={year}")

        df = load_parquet_cached(
            year_path,
            (
                "avg_user_rating",
                "avg_sentiment_score",
                "negative_review_ratio"
            )
        )

        if df.empty:
            continue

        trend.append({
            "year": year,
            "avg_rating": float(df["avg_user_rating"].mean()),
            "avg_sentiment": float(df["avg_sentiment_score"].mean()),
            "negative_ratio": float(df["negative_review_ratio"].mean())
        })

    return {"trend": trend}

# BUSINESS HISTORY (RISK) - OPTIMIZED
@app.get("/business-history")
def get_business_history(state: str, name: str):

    years = STATE_YEAR_INDEX.get(state, [])
    history = []
    name = name.lower().strip()

    for year in years:
        year_path = os.path.join(BASE_PATH, f"state={state}", f"year={year}")

        df = load_parquet_cached(
            year_path,
            ("name", "gmap_id", "probability","total_reviews","negative_review_ratio","prediction","risk_label","avg_sentiment_score")
        )

        df_filtered = df[
            df["name"].str.lower().str.contains(name, na=False)
        ]

        if df_filtered.empty:
            continue

        records = df_filtered.to_dict(orient="records")

        for row in records:

            gmap_id = str(row["gmap_id"])

            try:
                hex_cid = gmap_id.split(":")[1]
                decimal_cid = int(hex_cid, 16)
                maps_link = f"{GOOGLE_MAPS_BASE_URL}{decimal_cid}"
            except:
                maps_link = f"https://www.google.com/maps/search/?api=1&query={row['name']}"

            values = row["probability"]["values"] if isinstance(row["probability"], dict) else row["probability"]

            history.append({
                "year": year,
                "state": state,
                "gmap_id": gmap_id,
                "google_maps_link": maps_link,
                "low": float(values[0]),
                "medium": float(values[1]),
                "high": float(values[2]),   
                "total_reviews": int(row["total_reviews"]),
                "negative_review_ratio": float(row["negative_review_ratio"]),
                "prediction": int(row["prediction"]),
                "risk_label": row["risk_label"],
                "avg_sentiment_score": float(row["avg_sentiment_score"])
              })

    return {"history": sorted(history, key=lambda x: x["year"])}

# BUSINESS CUSTOMER HISTORY (OPTIMIZED)
@app.get("/business-customer-history")
def get_business_customer_history(state: str, name: str):

    years = STATE_YEAR_INDEX.get(state, [])
    history = []
    name = name.lower().strip()

    for year in years:
        year_path = os.path.join(BASE_PATH, f"state={state}", f"year={year}")

        df = load_parquet_cached(
            year_path,
            (
                "name",
                "gmap_id",
                "avg_user_rating",
                "avg_sentiment_score",
                "negative_review_ratio",
                "yearly_negative_trend",
                "rating_sentiment_gap"
            )
        )

        df_filtered = df[
            df["name"].str.lower().str.contains(name, na=False)
        ]

        if df_filtered.empty:
            continue

        records = df_filtered.to_dict(orient="records")

        for row in records:

            gmap_id = str(row["gmap_id"])

            try:
                hex_cid = gmap_id.split(":")[1]
                decimal_cid = int(hex_cid, 16)
                maps_link = f"{GOOGLE_MAPS_BASE_URL}{decimal_cid}"
            except:
                maps_link = f"https://www.google.com/maps/search/?api=1&query={row['name']}"

            history.append({
                "year": year,
                "gmap_id": gmap_id,
                "google_maps_link": maps_link,
                "avg_rating": float(row.get("avg_user_rating", 0)),
                "avg_sentiment": float(row.get("avg_sentiment_score", 0)),
                "negative_ratio": float(row.get("negative_review_ratio", 0)),
                "yearly_negative_trend": float(row.get("yearly_negative_trend", 0)),
                "gap": float(row.get("rating_sentiment_gap", 0))
            })

    return {"history": sorted(history, key=lambda x: x["year"])}

# COMPETITIVE BENCHMARK (LEADERBOARD ONLY)
@app.get("/competitive-benchmark")
def get_competitive_benchmark(
    state: str,
    year: int,
    category: str = ""
):
    try:

        year_path = os.path.join(BASE_PATH, f"state={state}", f"year={year}")

        if not os.path.exists(year_path):
            return {
                "total_competitors": 0,
                "average_risk_score": 0,
                "leaderboard": []
            }

        df = pd.read_parquet(year_path)

        if df.empty:
            return {
                "total_competitors": 0,
                "average_risk_score": 0,
                "leaderboard": []
            }

        # CATEGORY FILTER (numpy safe)
        if category:
            df = df[
                df["category"].apply(
                    lambda cats: any(
                        category.lower() in str(cat).lower()
                        for cat in (
                            cats if isinstance(cats, (list, np.ndarray)) else []
                        )
                    )
                )
            ]

        if df.empty:
            return {
                "total_competitors": 0,
                "average_risk_score": 0,
                "leaderboard": []
            }

        # AGGREGATE PER BUSINESS
        agg_df = (
            df.groupby("gmap_id")
            .agg({
                "name": "first",
                "risk_score": "mean",
                "avg_user_rating": "mean",
                "yearly_negative_trend": "mean"
            })
            .reset_index()
        )

        total_competitors = len(agg_df)

        if total_competitors == 0:
            return {
                "total_competitors": 0,
                "average_risk_score": 0,
                "leaderboard": []
            }

        # CATEGORY AVERAGE
        category_avg = agg_df["risk_score"].mean()

        if category_avg == 0:
            category_avg = 0.0001  # avoid divide-by-zero

        # SORT & RANK (Higher risk = worse)
        agg_df = agg_df.sort_values("risk_score", ascending=False)
        agg_df["rank"] = np.arange(1, total_competitors + 1)

        # VS CATEGORY %
        agg_df["vs_avg_percent"] = (
            (agg_df["risk_score"] - category_avg) / category_avg * 100
        ).round(2)

        # GOOGLE MAPS LINK
        GOOGLE_MAPS_BASE_URL = "https://www.google.com/maps?cid="

        def build_maps_link(gmap_id):
            try:
                hex_cid = gmap_id.split(":")[1]
                decimal_cid = int(hex_cid, 16)
                return f"{GOOGLE_MAPS_BASE_URL}{decimal_cid}"
            except:
                return None

        agg_df["google_maps_link"] = agg_df["gmap_id"].apply(build_maps_link)

        # BUILD RESPONSE
        leaderboard = agg_df[
            [
                "gmap_id",
                "rank",
                "name",
                "risk_score",
                "vs_avg_percent",
                "yearly_negative_trend",
                "google_maps_link"
            ]
        ].to_dict(orient="records")

        return {
            "total_competitors": total_competitors,
            "average_risk_score": float(category_avg),
            "leaderboard": leaderboard
        }

    except Exception as e:
        return {"error": str(e)}
    

# BUSINESS BENCHMARK DETAILS (MULTI-BRANCH VERSION)
@app.get("/business-benchmark-details")
def get_business_benchmark_details(
    state: str,
    year: int,
    category: str,
    name: str
):
    try:
        year_path = os.path.join(BASE_PATH, f"state={state}", f"year={year}")

        if not os.path.exists(year_path):
            return {"branches": []}

        df = pd.read_parquet(year_path)

        if df.empty:
            return {"branches": []}

        # CATEGORY FILTER
        df = df[
            df["category"].apply(
                lambda cats: any(
                    category.lower() in str(cat).lower()
                    for cat in (cats if isinstance(cats, (list, np.ndarray)) else [])
                )
            )
        ]

        if df.empty:
            return {"branches": []}

        # AGGREGATE PER BRANCH
        agg_df = (
            df.groupby("gmap_id")
            .agg({
                "name": "first",
                "risk_score": "mean"
            })
            .reset_index()
        )

        if agg_df.empty:
            return {"branches": []}

        total_competitors = len(agg_df)
        category_avg = agg_df["risk_score"].mean()

        # Ranking (higher risk = worse)
        agg_df = agg_df.sort_values("risk_score", ascending=False)
        agg_df["rank"] = np.arange(1, total_competitors + 1)

        # vs avg %
        agg_df["vs_avg_percent"] = (
            (agg_df["risk_score"] - category_avg) / category_avg * 100
        ).round(2)

        # FILTER BY BUSINESS NAME (MULTIPLE BRANCHES)
        matched_branches = agg_df[
            agg_df["name"].str.lower().str.contains(name.lower(), na=False)
        ]

        if matched_branches.empty:
            return {"branches": []}

        # GOOGLE MAPS LINK BUILDER
        GOOGLE_MAPS_BASE_URL = "https://www.google.com/maps?cid="

        def build_maps_link(gmap_id):
            try:
                hex_cid = gmap_id.split(":")[1]
                decimal_cid = int(hex_cid, 16)
                return f"{GOOGLE_MAPS_BASE_URL}{decimal_cid}"
            except:
                return None

        matched_branches["google_maps_link"] = matched_branches["gmap_id"].apply(build_maps_link)

        # FINAL RESPONSE
        branches = matched_branches[
            ["gmap_id", "name", "rank", "risk_score", "vs_avg_percent", "google_maps_link"]
        ].to_dict(orient="records")

        return {
            "total_competitors": total_competitors,
            "average_risk_score": float(category_avg),
            "branches": branches
        }

    except Exception as e:
        return {"error": str(e)}

# INVESTMENT & EXPANSION DECISION SUPPORT
@app.get("/investment-analysis")
def get_investment_analysis(
    state: str,
    years: List[int] = Query(...),
    category: str = ""
):
    try:

        all_data = []

        # LOAD SELECTED YEARS
        for year in years:
            year_path = os.path.join(BASE_PATH, f"state={state}", f"year={year}")

            if not os.path.exists(year_path):
                continue

            df = pd.read_parquet(year_path)

            if df.empty:
                continue

            df["year"] = year
            all_data.append(df)

        if not all_data:
            return {
                "kpis": {
                    "state_average_risk": 0,
                    "risk_trend_percent": 0,
                    "best_category": "-"
                },
                "categories": []
            }

        df = pd.concat(all_data, ignore_index=True)

        # OPTIONAL CATEGORY FILTER
        if category:
            df = df[
                df["category"].apply(
                    lambda cats: any(
                        category.lower() in str(cat).lower()
                        for cat in (cats if isinstance(cats, (list, np.ndarray)) else [])
                    )
                )
            ]

        if df.empty:
            return {
                "kpis": {
                    "state_average_risk": 0,
                    "risk_trend_percent": 0,
                    "best_category": "-"
                },
                "categories": []
            }

        # STATE AVERAGE RISK (SAFE)
        state_avg_risk = float(df["risk_score"].mean()) if not df["risk_score"].isna().all() else 0

        # YOY TREND (SAFE)
        risk_trend_percent = 0

        if len(years) >= 2:
            yearly_avg = (
                df.groupby("year")["risk_score"]
                .mean()
                .dropna()
                .sort_index()
            )

            if len(yearly_avg) >= 2:
                latest = yearly_avg.iloc[-1]
                prev = yearly_avg.iloc[-2]

                if prev != 0:
                    risk_trend_percent = round(
                        ((latest - prev) / prev) * 100, 2
                    )

        # GROUP BY CATEGORY (SAFE)
        df_exploded = df.explode("category")

        grouped = (
            df_exploded.groupby("category")
            .agg({
                "risk_score": "mean",
                "gmap_id": "nunique"
            })
            .reset_index()
            .rename(columns={"gmap_id": "business_count"})
        )

        if grouped.empty:
            return {
                "kpis": {
                    "state_average_risk": round(state_avg_risk, 3),
                    "risk_trend_percent": risk_trend_percent,
                    "best_category": "-"
                },
                "categories": []
            }

        # INVESTMENT SIGNAL
        def get_signal(risk):
            if risk < 0.3:
                return "Strong"
            elif risk < 0.6:
                return "Moderate"
            else:
                return "Avoid"

        grouped["investment_signal"] = grouped["risk_score"].apply(get_signal)

        grouped = grouped.sort_values("risk_score", ascending=True)

        best_category = grouped.iloc[0]["category"]

        return {
            "kpis": {
                "state_average_risk": round(state_avg_risk, 3),
                "risk_trend_percent": risk_trend_percent,
                "best_category": best_category
            },
            "categories": grouped.to_dict(orient="records")
        }

    except Exception as e:
        return {"error": str(e)}

@app.get("/investment-category-leaderboard")
def get_category_leaderboard(
    state: str,
    years: List[int] = Query(...),
    category: str = ""
):
    try:

        all_data = []

        for year in years:
            year_path = os.path.join(BASE_PATH, f"state={state}", f"year={year}")
            if not os.path.exists(year_path):
                continue

            df = pd.read_parquet(year_path)
            df["year"] = year
            all_data.append(df)

        if not all_data:
            return {"leaderboard": []}

        df = pd.concat(all_data, ignore_index=True)

        # FILTER CATEGORY
        df = df[
            df["category"].apply(
                lambda cats: any(
                    category.lower() in str(cat).lower()
                    for cat in (cats if isinstance(cats, (list, np.ndarray)) else [])
                )
            )
        ]

        if df.empty:
            return {"leaderboard": []}

        # AGGREGATE PER BUSINESS
        agg_df = (
            df.groupby("gmap_id")
            .agg({
                "name": "first",
                "risk_score": "mean",
            })
            .reset_index()
        )

        agg_df = agg_df.sort_values("risk_score", ascending=True)
        agg_df["rank"] = np.arange(1, len(agg_df) + 1)

        # GOOGLE MAPS LINK
        GOOGLE_MAPS_BASE_URL = "https://www.google.com/maps?cid="

        def build_maps_link(gmap_id):
            try:
                hex_cid = gmap_id.split(":")[1]
                decimal_cid = int(hex_cid, 16)
                return f"{GOOGLE_MAPS_BASE_URL}{decimal_cid}"
            except:
                return None

        agg_df["google_maps_link"] = agg_df["gmap_id"].apply(build_maps_link)

        leaderboard = agg_df[
            ["rank", "name", "risk_score", "gmap_id", "google_maps_link"]
        ].to_dict(orient="records")

        return {"leaderboard": leaderboard}

    except Exception as e:
        return {"error": str(e)}


@app.get("/investment-business-details")
def get_business_details(
    state: str,
    gmap_id: str
):
    try:

        state_path = os.path.join(BASE_PATH, f"state={state}")

        if not os.path.exists(state_path):
            return {"trend": []}

        trend = []

        # LOAD ALL YEARS FOR THAT STATE
        for folder in os.listdir(state_path):
            if not folder.startswith("year="):
                continue

            year = int(folder.replace("year=", ""))
            year_path = os.path.join(state_path, folder)

            df = pd.read_parquet(year_path)

            row = df[df["gmap_id"] == gmap_id]

            if not row.empty:
                trend.append({
                    "year": year,
                    "risk_score": float(row["risk_score"].values[0]),
                    "avg_rating": float(row["avg_user_rating"].values[0])
                })

        trend = sorted(trend, key=lambda x: x["year"])

        return {
            "trend": trend
        }

    except Exception as e:
        return {"error": str(e)}
    
# COMPLAINT SEVERITY LEADERBOARD
@app.get("/complaint-severity")
def get_complaint_severity(state: str, year: int):

    year_path = os.path.join(BASE_PATH, f"state={state}", f"year={year}")

    # If year folder doesn't exist
    if not os.path.exists(year_path):
        return {
            "worst_business": None,
            "leaderboard": [],
            "message": "No significant complaint activity detected for this year."
        }

    df = load_parquet_cached(
        year_path,
        (
            "name",
            "gmap_id",
            "negative_review_ratio",
            "avg_sentiment_score",
            "total_reviews"
        )
    )

    # Remove small sample size businesses
    df = df[df["total_reviews"] >= 10].copy()

    # If no businesses remain after filtering
    if df.empty:
        return {
            "worst_business": None,
            "leaderboard": [],
            "message": "No significant complaint activity detected for this year."
        }

    # Compute weighted complaint score
    df["complaint_score"] = (
        df["negative_review_ratio"] *
        np.log(df["total_reviews"] + 1)
    )
    
    df = df[df["complaint_score"] > 0]

    # If all businesses have 0 negative ratio
    if df["negative_review_ratio"].max() == 0:
        return {
            "worst_business": None,
            "leaderboard": [],
            "message": "No significant complaint activity detected for this year."
        }

    # Sort by complaint_score
    df = df.sort_values(
        "complaint_score",
        ascending=False
    ).reset_index(drop=True)

    df["rank"] = df.index + 1

    leaderboard = df[[
        "rank",
        "name",
        "gmap_id",
        "complaint_score",
        "negative_review_ratio",
        "avg_sentiment_score",
        "total_reviews"
    ]].to_dict(orient="records")

    worst_business = leaderboard[0] if leaderboard else None

    return {
        "worst_business": worst_business,
        "leaderboard": leaderboard,
        "message": None
    }
    
# COMPLAINT BUSINESS TREND
@app.get("/complaint-business-history")
def get_complaint_business_history(state: str, name: str):

    years = STATE_YEAR_INDEX.get(state, [])
    history = []

    GOOGLE_MAPS_BASE_URL = "https://www.google.com/maps?cid="

    def build_maps_link(gmap_id):
        try:
            hex_cid = gmap_id.split(":")[1]
            decimal_cid = int(hex_cid, 16)
            return f"{GOOGLE_MAPS_BASE_URL}{decimal_cid}"
        except:
            return None

    for year in years:

        year_path = os.path.join(BASE_PATH, f"state={state}", f"year={year}")

        if not os.path.exists(year_path):
            continue

        df = load_parquet_cached(
            year_path,
            (
                "name",
                "gmap_id",
                "negative_review_ratio"
            )
        )

        df_filtered = df[
            df["name"].str.lower().str.contains(name.lower(), na=False)
        ]

        if df_filtered.empty:
            continue

        for _, row in df_filtered.iterrows():

            history.append({
                "year": year,
                "gmap_id": row["gmap_id"],
                "negative_ratio": float(row["negative_review_ratio"]),
                "google_maps_link": build_maps_link(row["gmap_id"])
            })

    return {"history": sorted(history, key=lambda x: x["year"])}

# RUN SERVER
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
