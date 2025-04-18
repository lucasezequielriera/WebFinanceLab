Steps:

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

** REPOSITORY UPDATED IN LOCAL & GITHUB **