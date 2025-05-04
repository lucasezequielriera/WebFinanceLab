** STEPS TO PUSH THE REPOSITORY TO GITHUB AND FIREBASE **

// Changes to Github
1) git add .
2) git commit -m 'change/s'
3) git push

// Building to deploy back files (services like functions) 
4) npm run build
4) a) If npm run build -> ERROR ->
rm -rf node_modules                      
rm package-lock.json
and ->
npm i
5) firebase deploy
5) a) if I did changes only in functions (e.g. telegram) -> firebase deploy --only functions
6) firebase deploy --only firestore:rules
6) a) if I did changes only in firebase rules

** LEVELS **

- LV 0 (Admin Account)
- LV 1 (Free Account) (Just 1 limit in Financial Goals)
- LV 2 (Premium Account (Telegram & Whatsapp Actived))
- LV 3 (Black Account)