import React, { Component } from "react";

type MaxLengthTextFieldProps = {
  value: string;
  onChange: (text: string) => void;

  /*Set to -1 to disable.*/
  maxLength?: number;
  label?: string;
  placeholder?: string;
  /*Shows the remaining characters left (before hitting the maxLength).*/
  showCharCount?: boolean;
  /*Set to true to make all character input uppercase.*/
  forceUpperCase?: boolean;
};

const defaultProps: Partial<MaxLengthTextFieldProps> = {
  maxLength: 12 /*Set to -1 to disable.*/,
  label: "Label",
  placeholder: "",
  showCharCount: true /*Shows the remaining characters left (before hitting the maxLength).*/,
  forceUpperCase: false /*Set to true to make all character input uppercase.*/,
};

/**
 * Collapses whitespace characters (' ' and '\t') to single spaces.
 * @param text
 * @return the text, but any repeating sequences of '\t' or ' ' are replaced with a single ' ' character.
 */
function collapseSpaces(text: string): string {
  return text.replace(/\s\s+/g, " ");
}

/**
 * A MaxLengthTextField is a text field that has a constrained
 * String length, and includes labels and remaining character counters.
 */
export default function MaxLengthTextField(
  inputProps: MaxLengthTextFieldProps,
): React.ReactElement {
  const props = {
    ...defaultProps,
    ...inputProps,
  } as Required<MaxLengthTextFieldProps>;

  const charactersLeftText = props.showCharCount
    ? (props.maxLength - props.value.length).toString()
    : "";

  /**
   * Called when the text field changes.
   * @param event the change event.
   * @effects Calls {@code this.props.onChange} with the modified text of the event, where any whitespace (' ' or '\t') from
   *          the front of the text is removed and the text length is trimmed to be {@literal <=} {@code this.props.maxLength}
   */
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let text = event.target.value;
    text = collapseSpaces(text.trim());
    if (props.maxLength !== -1) {
      text = text.substring(0, props.maxLength); // cut down the value.
    }
    if (props.forceUpperCase) {
      text = text.toUpperCase();
    }
    props.onChange(text);
  };

  return (
    <div style={{ flexDirection: "column", margin: "10px" }}>
      <label>
        <div
          style={{
            display: "flex",
            width: "calc(10px + 40vmin)",
            flexDirection: "row",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <p style={{ margin: "2px" }}>{props.label}</p>
          <p style={{ margin: "2px", marginLeft: "auto" }}>
            {charactersLeftText}
          </p>
        </div>
        <input
          value={props.value}
          onChange={handleChange}
          placeholder={props.placeholder}
          autoComplete={"off"}
        ></input>
      </label>
    </div>
  );
}
