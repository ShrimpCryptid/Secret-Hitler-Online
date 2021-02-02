import React, {Component} from "react";
import PropTypes from "prop-types";
import ReactGA from "react-ga";
import "./LoginPageContent.css";

class LoginPageContent extends Component {

    constructor(props) {
        super(props);
    }

    onClickAbout = () => {
        ReactGA.event({
            category: "Clicked About",
            action: "User clicked the link for the about page."
        });
    };

    onClickGameWebsite = () => {
        ReactGA.event({
            category: "Clicked Game Website",
            action: "User clicked the link for the board game website."
        });
    };

    render() {
        return (
            <>
                <div id={"login-page-description-container"}>
                    <h2>What is Secret Hitler Online?</h2>

                    <div id={"login-page-description-text-container"}>
                        <p id={"login-page-description-text"}>
                            Secret Hitler Online is an adaptation of the original Secret Hitler board game,
                            reimagined for the web.
                            It supports 5-10 players, featuring smooth art and animations with all the secrecy and
                            intrigue of the original. It's designed to be easy to pick up and play for any quarantine
                            game night. Play for free in your browser, with no ads ever!
                            <br/><br/>
                            The project is open-source, and is licensed under <a
                                href={"https://creativecommons.org/licenses/by-nc-sa/4.0/"}
                                rel="noopener"
                                target={"_blank"}>
                                    CC BY-NC-SA 4.0
                            </a>.
                            You can read more about the project <a
                                href={"https://github.com/ShrimpCryptid/Secret-Hitler-Online/blob/master/README.md"}
                                rel="noopener"
                                target={"_blank"} onClick={this.onClickAbout}>
                                    here
                            </a>!
                            <br/><br/>
                            Adapted from the original <a href={"https://secrethitler.com"} target={"_blank"} rel="noopener" onClick={this.onClickGameWebsite}>
                                Secret Hitler
                            </a> board game by Goat, Wolf, & Cabbage (© 2016-2020). Developed by ShrimpCryptid (© 2020-2021).
                            <br/><br/>
                            Found an bug or want to leave a comment? Report bugs on the <a href={"https://github.com/ShrimpCryptid/Secret-Hitler-Online/issues"}
                                                                                             rel="noopener"
                                                                                             target={"_blank"}>Issues page</a>.
                        </p>
                    </div>
                </div>
            </>
        );
    }

}

LoginPageContent.propTypes = {
};

export default LoginPageContent;