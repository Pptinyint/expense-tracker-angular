# Push this project to GitHub

Repo to create: **expense-tracker-angular** under https://github.com/Pptinyint

> Do these steps from inside this project folder on your own computer.
> Nothing here is pushed automatically.

## 1. Create the empty repo on GitHub (website)

1. Go to https://github.com/new
2. Repository name: `expense-tracker-angular`
3. Description (optional): `Expense tracker built with Angular — income, expenses, categories, monthly summaries, localStorage persistence.`
4. Visibility: **Public**
5. Leave **all** checkboxes unchecked (no README, no .gitignore, no licence) — this folder already has them.
6. Click **Create repository**.

## 2. Push from your terminal

```bash
cd expense-tracker-angular

git init
git add .
git commit -m "feat: expense tracker — dashboard, transactions, categories, monthly summary"

git branch -M main
git remote add origin https://github.com/Pptinyint/expense-tracker-angular.git
git push -u origin main
```

## 3. Check

Open https://github.com/Pptinyint/expense-tracker-angular — the code and the
README should be there. `node_modules/` and `dist/` are ignored via
`.gitignore`, so they are not uploaded.

## Later updates

After any change, from inside the folder:

```bash
git add .
git commit -m "describe your change"
git push
```
