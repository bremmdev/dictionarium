# New LASLA data

`vault/frequency.md`: rebuild `data/lasla-frequency.json` only when LASLA publishes new files. This task finds out whether it has. It changes nothing and opens no PR.

1. When was the data last built? `git log -1 --format=%cs -- data/lasla-frequency.json`.
2. What has LASLA published since? List the commits on the default branch of `github.com/CIRCSE/LASLA` after that date, and the files they touched.
3. Answer in a few lines:
   - **Nothing new:** one line, and stop.
   - **Only docs or tooling changed** (README, scripts, CI): say so. No rebuild needed.
   - **Corpus files changed** (anything under `conllup/`): list which ones and roughly how much changed, and say a rebuild is due. Give the two commands from `vault/frequency.md`. Don't run them, because the rebuild queries LiLa's SPARQL endpoint and the user decides when.
