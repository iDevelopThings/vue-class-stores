rm -R dist
yarn build-package
cp -R template dist/template
cp package.json dist/package.json
cp -R bin dist/bin
cp README.md dist/README.md

git add .
git commit -m "Built assets ready for publishing"

npm version patch
cp package.json dist/package.json

PACKAGE_VERSION=$(node -p -e "require('./package.json').version")

git add package.json
git add dist
git commit -m "Increment package version to $PACKAGE_VERSION"

cd dist || exit

npm publish --access public

cd ../ || exit

git push origin main
