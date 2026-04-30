Airbnb Market Dashboard

A React-based dashboard for analyzing Airbnb market data from CSV uploads.

Prerequisites

Node.js (v16 or higher)

GitHub account

Vercel account

How to Deploy

1. Initialize Git and Push to GitHub

In your local project folder:

git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin [https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git)
git push -u origin main


2. Connect to Vercel

Go to Vercel.

Click Add New > Project.

Import your GitHub repository.

Vercel will automatically detect the Vite configuration.

Click Deploy.

Features

CSV Data Parsing for multiple markets (Berlin, Munich).

Property Filter (Room Type, Bedrooms, Bathrooms).

Text Analysis (Title/Description word count correlations).

Revenue & Rating visualizations via Recharts.