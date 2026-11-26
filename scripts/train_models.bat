@echo off
echo =====================================================================
echo  Edge-Based Hostel Maintenance Complaint Prioritization System
echo  DistilBERT Fine-Tuning Pipeline
echo =====================================================================

cd /d "%~dp0\.."

echo.
echo [Step 1/5] Generating balanced, stratified complaint dataset (1200 records)...
python backend\training\generate_dataset.py
if errorlevel 1 (
    echo [ERROR] Dataset generation failed.
    pause
    exit /b 1
)

echo.
echo [Step 2/5] Fine-tuning Model 1: Category Classifier (6 classes)...
python backend\training\train_category.py
if errorlevel 1 (
    echo [ERROR] Category model fine-tuning failed.
    pause
    exit /b 1
)

echo.
echo [Step 3/5] Fine-tuning Model 2: Urgency Classifier (4 classes)...
python backend\training\train_urgency.py
if errorlevel 1 (
    echo [ERROR] Urgency model fine-tuning failed.
    pause
    exit /b 1
)

echo.
echo [Step 4/5] Evaluating both models on held-out test split (180 samples)...
python backend\training\evaluate_models.py
if errorlevel 1 (
    echo [ERROR] Model evaluation failed.
    pause
    exit /b 1
)

echo.
echo [Step 5/5] Seeding evaluation metrics into SQLite database...
python -m backend.app.seed

echo.
echo =====================================================================
echo  Fine-Tuning & Evaluation Completed Successfully!
echo  Models saved in: backend\models\category_model and backend\models\urgency_model
echo  To run the application, execute: scripts\start_project.bat
echo =====================================================================
pause
