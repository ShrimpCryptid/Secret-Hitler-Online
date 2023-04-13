import React, {Component} from "react";
import ReactGA from "react-ga";
import "./LoginPageContent.css";
import "./util/CustomAliceCarousel.css";


class LoginPageContent extends Component {

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
        let handleDragStart = (e) => e.preventDefault();
        let items = [
            <img id={"login-page-gif"} src={'https://i.postimg.cc/zvnLRbqq/place-policy.gif'} onDragStart={handleDragStart} alt={"A policy tile being placed on the board."}/>,
            <img id={"login-page-gif"} src={'https://i.postimg.cc/Wbvqcn7z/show-policy.gif'} onDragStart={handleDragStart} alt={"An animated folder revealing a policy tile."}/>,
            <img id={"login-page-gif"} src={'https://i.postimg.cc/cCNCZxw2/show-votes.gif'} onDragStart={handleDragStart} alt={"An animation showing all the cast votes."}/>
        ];
        return (
            <>
                <div id={"#login-page-description-container"}>
                    <div id={"login-page-description-text-container"}>
                        <h2 id={"login-page-description-text-header"}>What is Secret Hitler Online?</h2>
                        <p id={"login-page-description-text"}>
                            Secret Hitler Online is an adaptation of the original Secret Hitler board game,
                            reimagined for the web.
                            It supports up to 10 players, featuring smooth art and animations with all the secrecy and
                            intrigue of the original. It's designed to be easy to pick up and play for any quarantine
                            game night.<br/><br/>Play for free in your browser, with no ads ever!
                            <br/> <br/>
                        </p>
                    </div>
                    <div id={"login-page-gif-container"}>
                        {items}
                    </div>
                    <div id={"login-page-description-text-container"}>
                        <p id={"login-page-description-text"}>
                            <br/>
                            The project is open-source, and is licensed under CC BY-NC-SA 4.0.
                            You can read more about the project <a
                                href={"https://github.com/ShrimpCryptid/Secret-Hitler-Online/"}
                                rel="noreferrer"
                                target={"_blank"} onClick={this.onClickAbout}>
                                    on GitHub
                            </a>!
                            <br/><br/>
                            Adapted from the original <a href={"https://secrethitler.com"} target={"_blank"} rel="noreferrer" onClick={this.onClickGameWebsite}>
                                Secret Hitler
                            </a> board game by Goat, Wolf, & Cabbage (© 2016-2020). Developed by ShrimpCryptid (© 2020-2021).
                            <br/><br/>
                            Found a bug or want to leave a comment? Report bugs on the <a href={"https://github.com/ShrimpCryptid/Secret-Hitler-Online/issues"}
                                                                                             rel="noreferrer"
                                                                                             target={"_blank"}>Issues page</a>.
                        </p>
                        <br/>
                    </div>

                </div>
            </>
        );
    }

}

/*
<div id={"login-page-carousel-container"}>
                        <AliceCarousel mouseTracking items={items} />
                    </div>
 */

LoginPageContent.propTypes = {
};

export default LoginPageContent;