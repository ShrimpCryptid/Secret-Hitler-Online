import React, {Component} from "react";
import "./AnnouncementBox.css";
import { badge } from "../assets";

/**
 * A MaxLengthTextField is a text field that has a constrained
 * String length, and includes labels and remaining character counters.
 */
class AnnouncementBox extends Component {

  render() {
    return (
    <div className={"announcement-container"}>
      <div className={"announcement-image-container"}>
        <img
          id={"icon"}
          className={"announcement-image"}
          src={badge}
          alt=""
        />
        <h2
          className={"announcement-image-text"}
        >{this.props.headerText}</h2>

      </div>
      <div>
        {this.props.children}
      </div>
    </div>);
  }
}

AnnouncementBox.defaultProps = {
  headerText: "NEW!"
}

export default AnnouncementBox;
