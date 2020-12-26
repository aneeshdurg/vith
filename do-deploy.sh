#!/bin/bash
set -ex

[ ! -e .live/ ] && git clone https://github.com/aneeshdurg/video-synth .live

pushd .live
git pull
git checkout gh-pages || git checkout -b gh-pages

rm -r *
cp -r ../build/* .

git add .
git commit -m Updates --allow-empty
git push origin gh-pages
popd
