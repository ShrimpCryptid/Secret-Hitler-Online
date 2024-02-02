import React from "react";
import { Helmet } from "react-helmet";

export default function HelmetMetaData(props) {
	let location = "/";
	let currentUrl = "http://www.secret-hitler.online" + location; // location.pathname
	let quote = props.quote !== undefined ? props.quote : "";
	let title = props.title !== undefined ? props.title : "Secret Hitler Online";
	let image =
		props.image !== undefined
			? props.image
			: "https://live.staticflickr.com/65535/49904192417_3bf847b3f9_w.jpg";
	let description =
		props.description !== undefined
			? props.description
			: "Secret Hitler Online is a free hidden-identity game for up to 10 players, elegantly adapted from the original Secret Hitler. " +
			  "Play for free in your browser with no ads ever. Can you find and stop the Secret Hitler?";
	let hashtag =
		props.hashtag !== undefined ? props.hashtag : "#SecretHitlerOnline";
	return (
		<Helmet>
			<title>{title}</title>
			<meta charSet="utf-8" />
			<link rel="icon" href="favicon.ico" />
			<meta name="csrf_token" content="" />
			<meta property="type" content="website" />
			<meta property="url" content={currentUrl} />
			<meta
				name="viewport"
				content="width=device-width, initial-scale=1, shrink-to-fit=no"
			/>
			<meta name="msapplication-TileColor" content="#e05b2b" />
			<meta name="msapplication-TileImage" content="favicon.ico" />
			<meta name="theme-color" content="#e05b2b" />
			<meta name="_token" content="" />
			<meta property="title" content={title} />
			<meta property="quote" content={quote} />
			<meta name="description" content={description} />
			<meta property="image" content={image} />
			<meta property="og:type" content="website" />
			<meta property="og:title" content={title} />
			<meta property="og:quote" content={quote} />
			<meta property="og:hashtag" content={hashtag} />
			<meta property="og:image" content={image} />
			<meta content="image/*" property="og:image:type" />
			<meta property="og:url" content={currentUrl} />
			<meta property="og:site_name" content="Secret Hitler Online" />
			<meta property="og:description" content={description} />
			<meta
				name="keywords"
				content="Secret Hitler, party game, play, free, online, tabletop simulator, board game"
			/>
		</Helmet>
	);
}
