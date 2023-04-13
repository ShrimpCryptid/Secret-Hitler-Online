# Deploying new backend builds to Fly.io
*Updated 11/26/2022*

Move to the backend directory from the project root
```
cd backend/
```

Build the latest version
```
./gradlew jar
```

Copy to target location (Windows)
```
mv build/libs/secret-hitler-online.jar target/secret-hitler-online.jar -Force
```

Deploy using fly cmdline
```
flyctl deploy
```