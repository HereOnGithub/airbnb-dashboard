# Airbnb Market Dashboard

An interactive analytics dashboard that visualizes Airbnb listing data across Berlin and Munich markets. Built as a single-page static site — no server, no build step, no dependencies to install.

**Live site:** [hereongithub.github.io/airbnb-dashboard-2026](https://hereongithub.github.io/airbnb-dashboard-2026/)

## What it does

The dashboard analyzes ~15,000 Airbnb listings and surfaces insights across two views:

- **Overview** — KPI cards (listing count, average price, rating distribution), top revenue-generating amenities, highest-rated listings with search, volume comparison between cities, and data-driven host recommendations
- **Text Analysis** — Correlates listing text length (titles, descriptions, neighborhood overviews) with revenue and guest ratings, helping hosts optimize their listing copy

Users can filter by city (Berlin/Munich) and neighborhood to drill into specific markets.

## What it's meant for

This project was built as a portfolio showcase demonstrating how to turn raw Airbnb market data into actionable insights through interactive visualization. It highlights skills in data processing, frontend development, and analytical thinking — all in a single HTML file with no framework overhead.

## Tech stack

- **Vanilla HTML/JS** — no React, no build tools
- **Tailwind CSS** (CDN) — styling
- **Chart.js** (CDN) — bar charts, doughnut charts, and composed bar+line charts
- **GitHub Pages** — hosting

## Data

Source data comes from two Inside Airbnb CSV exports (Berlin and Munich), pre-processed and embedded directly in `data.js` for instant page load. The raw CSVs are preserved in `data/` for reference.
