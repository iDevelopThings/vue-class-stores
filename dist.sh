rm -R dist
yarn build-package

git add .
git commit -m "Built assets ready for publishing"

npm version patch
cp package.json dist/package.json

PACKAGE_VERSION=$(node -p -e "require('./package.json').version")

git .
git commit -m "Increment package version to $PACKAGE_VERSION"

npm publish --access public

git push origin main
