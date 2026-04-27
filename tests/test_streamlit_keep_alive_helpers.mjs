import test from "node:test";
import assert from "node:assert/strict";

import {
  isAppFrameUrl,
  normalizeAppUrl,
  textHasLandingMarker,
  titleLooksReady,
} from "../scripts/streamlit_keep_alive_helpers.mjs";

test("normalizeAppUrl trims trailing slashes", () => {
  assert.equal(
    normalizeAppUrl("https://summa-moral-graph.streamlit.app///"),
    "https://summa-moral-graph.streamlit.app",
  );
});

test("titleLooksReady recognizes the live app title marker", () => {
  assert.equal(
    titleLooksReady("Summa Virtutum — Interactive map of Thomas Aquinas's moral corpus · Streamlit"),
    true,
  );
  assert.equal(titleLooksReady("Streamlit Sign In"), false);
});

test("textHasLandingMarker matches dashboard copy but not auth text", () => {
  assert.equal(
    textHasLandingMarker("Summa Virtutum\nAn interactive map of Thomas Aquinas's moral corpus"),
    true,
  );
  assert.equal(textHasLandingMarker("Sign in with GitHub"), false);
});

test("isAppFrameUrl recognizes Streamlit's embedded app frame", () => {
  const appUrl = "https://summa-moral-graph.streamlit.app/";

  assert.equal(
    isAppFrameUrl("https://summa-moral-graph.streamlit.app/~/+/", appUrl),
    true,
  );
  assert.equal(
    isAppFrameUrl("https://summa-moral-graph.streamlit.app/", appUrl),
    true,
  );
  assert.equal(
    isAppFrameUrl("https://qjmnz4vd2y07.statuspage.io/embed/frame", appUrl),
    false,
  );
});
