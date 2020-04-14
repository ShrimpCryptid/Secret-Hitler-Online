# Secret-Hitler-Online
A web adaptation of [Secret Hitler](https://secrethitler.com), a social deduction board game for 5-10 players by Goat, Wolf & Cabbage. You can play it with friends at [secrethitler.online](https://secrethitler.online)!

## The Game
In the game, players are divided into Liberals, Fascists, and one secret Hitler. The Liberals must work together (or not) to discover the secret Hitler hiding in their midst, all while the Fascists try to elevate the secret Hitler to power. Pass policies to achieve victory and unlock presidential powers to investigate your friends. 

Can you find and stop the Secret Hitler?

## Technical Specs
The Java server is divided into the [game simulation](src/main/java/game) and the [REST API](src/main/java/server). Communication between the server and client is done via websocket and HTTP requests, using the [Javalin library](https://javalin.io/).

The [webpage](/secret-hitler-online-interface) is written in [React](https://reactjs.org/), and features animations created with CSS.

## Creative Commons License and Credit
Secret Hitler Online is licensed under [Creative Commons BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/), and is adapted from the original board game released by Goat, Wolf & Cabbage (© 2016-2020).

All art assets were either adapted from the original game or custom-made by me in Inkscape.
