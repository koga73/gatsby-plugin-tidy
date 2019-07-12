//Grabbed from https://github.com/gatsbyjs/gatsby/issues/1526#issuecomment-433347822
export const onPreRenderHTML = ({ getHeadComponents }, pluginOptions) => {
	const removeInlineStyles = pluginOptions.removeInlineStyles || false;
	if (!removeInlineStyles) {
		return;
	}
	if (process.env.NODE_ENV !== "production") {
		return;
	}

	let hc = getHeadComponents();
	hc.forEach(el => {
		if (el.type === "style") {
			el.type = "link";
			el.props["href"] = el.props["data-href"];
			el.props["rel"] = "stylesheet";
			el.props["type"] = "text/css";

			delete el.props["data-href"];
			delete el.props["dangerouslySetInnerHTML"];
		}
	})
}