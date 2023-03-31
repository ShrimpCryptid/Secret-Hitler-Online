# Deploying new backend builds to Fly.io
*Updated 11/26/2022*

Build the latest version
```
./gradlew jar
```

Copy to target location
```
mv build/libs/secret-hitler-online.jar target/secret-hitler-online.jar --Force
```

Deploy using fly cmdline
```
flyctl deploy
```