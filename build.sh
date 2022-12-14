#!/bin/sh

echo Clean up...

rm -rf .parcel-cache && rm -rf dist
mkdir -p dist/intermediate

echo Bundle shader program...

./node_modules/.bin/glslify src/scene/scene.frag > dist/intermediate/out.frag
sed 's/#define GLSLIFY 1//' dist/intermediate/out.frag > dist/intermediate/out.clean.frag

./node_modules/.bin/glslify src/scene/scene.vert > dist/intermediate/out.vert
sed 's/#define GLSLIFY 1//' dist/intermediate/out.vert > dist/intermediate/out.clean.vert

echo Minify shader program...

mono tools/shader_minifier.exe dist/intermediate/out.clean.frag -o dist/intermediate/out.min.frag --format text --preserve-externals
mono tools/shader_minifier.exe dist/intermediate/out.clean.vert -o dist/intermediate/out.min.vert --format text --preserve-externals

echo Bundle app...

./node_modules/.bin/parcel build src/main.ts --no-cache --no-source-maps --dist-dir dist/intermediate

echo Compress app...

./node_modules/.bin/roadroller dist/intermediate/main.js -o dist/intermediate/main.min.js $@

echo Concat app to a minimal html...

echo '<canvas></canvas><script>' > dist/index.html
cat dist/intermediate/main.min.js >> dist/index.html
echo '</script>' >> dist/index.html

wc -c dist/index.html

echo Relocate assets...

mv dist/intermediate/*.png dist/
mv dist/intermediate/*.mp3 dist/
