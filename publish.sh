#!/usr/bin/bash
set -ex
rm -rf dist
npm run build
sed -f fix.sed index.html > dist/index.html
cp src/style.css dist/
cp vith.webmanifest dist/
cp service_worker.js dist/
cp -r icons/ dist/
if [ ! -z "$DOPUBLISH" ]
then
  cd dist
  git init
  git remote add origin 'https://github.com/aneeshdurg/vith.git'
  git checkout -b gh-pages
  git add .
  git commit -m "deploy"
  git push -f origin gh-pages
fi
