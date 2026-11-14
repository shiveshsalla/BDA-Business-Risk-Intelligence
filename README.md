# Business Risk Intelligence: Predictive Modeling of Business Closure Using Large-Scale Review Data

## Project Overview

Business Risk Intelligence is a Big Data Analytics project that predicts potential business closure risk by analyzing large-scale customer reviews and business metadata.

The system combines distributed data processing, Deep Learning-based sentiment analysis, feature engineering, Machine Learning classification, and Generative AI to identify businesses facing potential risks based on customer feedback patterns.

The project uses Apache Hadoop, Apache Spark, Spark NLP, Random Forest, and a locally deployed LLaMA3 model to provide scalable risk assessment and explainable insights through an interactive web dashboard.

## Dataset

**Dataset:** Google Local Reviews Dataset (2021)  
**Source:** UC San Diego – McAuley Lab

Dataset characteristics:

- Approximately 440 GB of uncompressed data.
- Around 666 million customer reviews.
- Approximately 4.9 million businesses.
- Covers multiple locations, years, and business categories.
- Contains structured business metadata, ratings, timestamps, and unstructured review text.

*Note: The original dataset is not included in this repository due to its large size.*

## Technologies Used

| Component | Technologies |
|---|---|
| Big Data Storage | Hadoop HDFS |
| Distributed Processing | Apache Spark, PySpark |
| Sentiment Analysis | Spark NLP, SentimentDL |
| Word Embeddings | Pretrained GloVe |
| Machine Learning | Random Forest Classifier, Spark MLlib |
| Generative AI | LLaMA3, Ollama |
| Backend | Python, FastAPI |
| Frontend | React.js, Vite |
| Data Storage | Parquet |
| Visualization | Recharts |

## Project Workflow

1. **Data Preprocessing:** Loaded raw Google review and business metadata into HDFS, cleaned the data, integrated review and business information, and partitioned the processed data.

2. **Sentiment Analysis:** Applied Spark NLP's SentimentDL deep learning model with pretrained GloVe word embeddings to identify positive and negative customer sentiments.

3. **Feature Engineering:** Extracted business-level features such as average user rating, total reviews, average sentiment score, negative review ratio, yearly negative trend, and rating–sentiment gap.

4. **Risk Score Calculation:** Generated business risk scores using engineered customer feedback indicators and classified businesses into LOW, MEDIUM, and HIGH risk categories.

5. **Machine Learning:** Trained a Random Forest classifier using aggregated business-level features to predict business risk categories.

6. **AI-Based Explainability:** Integrated a locally deployed LLaMA3 model to generate human-readable explanations using actual customer review excerpts.

7. **Interactive Dashboard:** Developed a React-based dashboard with a FastAPI backend to provide multiple business intelligence use cases.

## Dashboard Use Cases

The system provides five major analytical modules:

### 1. Business Risk Assessment
- Identifies businesses based on LOW, MEDIUM, and HIGH risk categories.
- Displays risk distribution and high-risk businesses.
- Generates AI-based explanations for predicted business risks.

### 2. Customer Experience Monitoring
- Analyzes average customer ratings and sentiment scores.
- Tracks negative review ratios and yearly customer sentiment trends.
- Provides business-level historical customer experience analysis.

### 3. Competitive Benchmarking
- Compares businesses within selected categories.
- Generates risk-based competitor rankings.
- Displays business risk relative to the category average.

### 4. Investment and Expansion Analysis
- Identifies business categories based on risk levels.
- Analyzes historical risk trends.
- Provides investment signals to support expansion decisions.

### 5. Complaint Severity Detection
- Identifies businesses with significant negative customer feedback.
- Calculates complaint severity scores.
- Generates complaint-based business rankings and historical trends.

## Model Performance

- Achieved **99% training accuracy** using the Random Forest classifier.
- Achieved **99% testing accuracy**.
- Obtained identical reported training and testing accuracy.
- Classifies businesses into LOW, MEDIUM, and HIGH risk categories.

## Repository Structure

```text
BDA-Business-Risk-Intelligence/
│
├── business-risk-frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
├── Data_Processing/
│   ├── state_wise_preprocessing.ipynb
│   ├── sentiment_analysis.ipynb
│   └── feature_aggregation_and_ml_feature_creation
│
├── model_training/
│   └── Model_Training.ipynb
│
├── risk-backend/
│   └── app.py
│
├── docs/
│   └── Report.pdf
│
├── README.md
└── .gitignore
```

## Installation and Execution

### 1. Clone the Repository

```bash
git clone https://github.com/shiveshsalla/BDA-Business-Risk-Intelligence.git
cd BDA-Business-Risk-Intelligence
```

### 2. Frontend Setup

```bash
cd business-risk-frontend
npm install
npm run dev
```

### 3. Backend Setup

```bash
cd risk-backend
pip install fastapi uvicorn pandas numpy requests pyarrow
python app.py
```

The backend runs on port `8000`.

### 4. Additional Requirements

The complete data processing and prediction pipeline requires:

- Hadoop HDFS
- Apache Spark with PySpark
- Spark NLP and pretrained sentiment models
- Access to the Google Local Reviews Dataset
- Ollama with the LLaMA3 model

Configure the dataset paths, Hadoop environment, and local LLM endpoint according to your system before execution.

## Project Report

The complete project documentation, including the methodology, implementation details, architecture, results, and dashboard screenshots, is available in:

`docs/Report.pdf`

## Project Objective

To develop a scalable and intelligent Business Risk Intelligence framework that combines Big Data Analytics, Deep Learning-based sentiment analysis, Machine Learning, and Generative AI to identify potential business risks and support data-driven decision-making.

---

**Project Domain:** Big Data Analytics | Machine Learning | Natural Language Processing | Generative AI