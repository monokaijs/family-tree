set -e
echo "Running ci_post_clone.sh"

cd ../../

brew install node cocoapods

npm i -g yarn

yarn install
CI="true" npx expo prebuild
