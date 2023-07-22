# Deploying new backend builds to Fly.io
*Updated 7/21/2023*

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
cp build/libs/secret-hitler-online.jar target/secret-hitler-online.jar -Force
```

Deploy using fly cmdline
```
flyctl deploy
```