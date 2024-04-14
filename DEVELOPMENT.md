# Development setup for Secret Hitler Online

Your setup will vary depending on if you're only making changes to the frontend, or if you're making changes to the frontend and the backend at once.

## Frontend Only

Follow these instructions if you are only making changes to the frontend. These instructions will allow you to connect to the development server rather than needing to run the instance locally.

### Running frontend server

Open a terminal window and run the following commands to clone the project and set up the frontend dependencies:

```bash
git clone git@github.com:ShrimpCryptid/Secret-Hitler-Online.git
cd Secret-Hitler-Online/frontend

npm install
npm run devServer
```

The webpage should open automatically in your browser, but is usually hosted at [localhost:3000](http://locahost:3000).

## Changing frontend + backend

If you're modifying the backend, you'll need to run the server locally. You'll need two terminal windows to run the frontend and backend.

### Running backend server

In your first terminal, clone the repo if you haven't yet. Navigate to the `backend` subdirectory, then use gradle to start the server.

```bash
git clone git@github.com:ShrimpCryptid/Secret-Hitler-Online.git
cd Secret-Hitler-Online/backend

DEBUG_MODE=1 ./gradlew run
```

This will start the backend server at [`http://localhost:4040`](http://locahost:4040) by default. You need to include `DEBUG_MODE=1`, otherwise the CORS policy will block access from the frontend.

**Every time you make changes to Java files, you'll need to stop and restart the development server.**

(TODO: Add a gradle run configuration for running locally)

### Running frontend server

Open another terminal at the root of the project, and run the following commands.

```bash
cd frontend

npm install
npm run devLocal
```

Note: You may need to modify `.env.local` based on the address your dev server is mounted to. By default, `.env.local` is configured to use `localhost:4040`.
