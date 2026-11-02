---
title: "Lab: Experiments and Small Tools by Kiran K S"
description: "Experiments by Kiran K S: an animated calendar of a year of GitHub contributions, a tour of Txtudio's four products, and small tools from Rust to Android."
h1: "Lab"
updated: 2026-11-01
intro: "The Lab holds my experiments and small builds. Two interactive pieces sit at the top: a year of my GitHub contributions, square by square, and a quick tour of Txtudio's products. Below them are small tools I built between 2021 and 2025, from Rust utilities to an Android app."
pieces:
  - id: "contribution-calendar"
    title: "Contribution calendar"
    summary: "My GitHub contributions for the last twelve months, one square per day: grey for quiet days, deepening to coral on the busiest ones. The data is fetched when the site is built, and private work counts only as totals, never as repository names."
    interaction: "Hover a square to see its day and count. The total, the busiest day and each month's count are written out below."
  - id: "products"
    title: "Txtudio's products"
    summary: "Txtudio makes four products: Workeron, a business suite for HR, CRM, project management, marketing and forms; Snaptiqz for events; DoYourDesign for interior design studios; and the Audit Management Solution for Indian banks."
    interaction: "Choose a product with a click, a tap or the keyboard. Its screen and one-line description slide in."
toolsHeading: "Small tools"
tools:
  - name: "sass-rust-compiler"
    summary: "A Rust file watcher that compiles changed SCSS files to compressed CSS, mirroring the folder structure and skipping partials."
    stack: ["Rust", "grass", "notify"]
    year: 2024
    repo: "https://github.com/kirankrish792/sass-rust-compiler"
  - name: "copy_replace_text_cli"
    summary: "A Rust command-line tool that runs a regex find-and-replace on one file, writes the result to another and prints coloured errors."
    stack: ["Rust", "regex", "text_colorizer"]
    year: 2023
    repo: "https://github.com/kirankrish792/copy_replace_text_cli"
  - name: "coWin_mylocation"
    summary: "A COVID-19 vaccine slot alert that checked the public CoWIN API every five seconds and played a sound when first-dose slots opened."
    stack: ["JavaScript", "axios", "CoWIN public API"]
    year: 2021
    repo: "https://github.com/kirankrish792/coWin_mylocation"
  - name: "html-pdf-react"
    summary: "A React and Vite prototype that renders a purchase order as an A4 PDF, with an in-browser preview and a download link."
    stack: ["React", "Vite", "@react-pdf/renderer"]
    year: 2025
    repo: "https://github.com/kirankrish792/html-pdf-react"
  - name: "TodoAndroidApp"
    summary: "A to-do list app for Android, written in Kotlin with Jetpack Compose and Material 3."
    stack: ["Kotlin", "Jetpack Compose", "Material 3"]
    year: 2024
    repo: "https://github.com/kirankrish792/TodoAndroidApp"
---
