/**
 *  Class for 2D Vectors
*/
class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(v) {
        return new Vector2(this.x + v.x, this.y + v.y);
    }
    sub(v) {
        return new Vector2(this.x - v.x, this.y - v.y);
    }
    scale(s) {
        return new Vector2(this.x * s, this.y * s);
    }
    mul(v) {
        return new Vector2(this.x * v.x, this.y * v.y);
    }
    rotate(angle) {
        let x = this.x * Math.cos(angle) - this.y * Math.sin(angle);
        let y = this.x * Math.sin(angle) + this.y * Math.cos(angle);
        return new Vector2(x, y);
    }
    dot(v) {
        return this.x * v.x + this.y * v.y;
    }
    cross(v) {
        return this.x * v.y - this.y * v.x;
    }
    equals(v) {
        return this.x == v.x && this.y == v.y;
    }
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    length_sq() {
        return this.x * this.x + this.y * this.y;
    }
    angle() {
        return Math.atan2(this.y, this.x);
    }
    normalize() {
        let len = this.length();
        return new Vector2(this.x / len, this.y / len);
    }
    copy() {
        return new Vector2(this.x, this.y);
    }
    apply(f) {
        return f(this.copy());
    }
}
/**
 * Helper function to create a Vector2
 */
function V2(x, y) {
    return new Vector2(x, y);
}
/**
 * Helper function to create a Vector2 from an angle
 * @param angle angle in radians
 * @returns Vector2 with length 1
 */
function Vdir(angle) {
    return new Vector2(Math.cos(angle), Math.sin(angle));
}
class Transform {
    static translate(v) {
        return (p) => p.add(v);
    }
    static rotate(angle, pivot) {
        return (p) => p.sub(pivot).rotate(angle).add(pivot);
    }
    static scale(scale, origin) {
        return (p) => p.sub(origin).mul(scale).add(origin);
    }
    static reflect_over_point(q) {
        return (p) => p.sub(q).rotate(Math.PI).add(q);
    }
    static reflect_over_line(p1, p2) {
        let v = p2.sub(p1);
        let n = v.rotate(Math.PI / 2).normalize();
        return (p) => {
            let d = n.dot(p.sub(p1));
            return p.sub(n.scale(2 * d));
        };
    }
    static skewX(angle, ybase) {
        return (p) => {
            let x = p.x + (ybase - p.y) * Math.tan(angle);
            return new Vector2(x, p.y);
        };
    }
    static skewY(angle, xbase) {
        return (p) => {
            let y = p.y + (xbase - p.x) * Math.tan(angle);
            return new Vector2(p.x, y);
        };
    }
}

// BBCode parser for multiline text object
//
var BB_TokenType;
(function (BB_TokenType) {
    BB_TokenType["TEXT"] = "TEXT";
    BB_TokenType["OPEN_TAG"] = "OPEN_TAG";
    BB_TokenType["CLOSE_TAG"] = "CLOSE_TAG";
    BB_TokenType["EOF"] = "EOF";
})(BB_TokenType || (BB_TokenType = {}));
class BB_Lexer {
    static parse_tag_content(str) {
        if (str[0] === "/") {
            // close tag
            let name = str.substring(1);
            return {
                type: BB_TokenType.CLOSE_TAG,
                attributes: { _tag_name: name }
            };
        }
        // open tag
        let space_id = str.indexOf(" ");
        let equal_id = str.indexOf("=");
        if (space_id === -1 && equal_id === -1) {
            // [name]
            return {
                type: BB_TokenType.OPEN_TAG,
                attributes: { _tag_name: str }
            };
        }
        if (space_id === -1 && equal_id > 0) {
            // [name=value]
            let name = str.substring(0, equal_id);
            let value = str.substring(equal_id + 1);
            let attributes = { _tag_name: name };
            attributes[name] = value;
            return {
                type: BB_TokenType.OPEN_TAG,
                attributes
            };
        }
        // [name attr1=value1 attr2=value2]
        throw new Error("Unimplemented");
    }
    static parse(text) {
        let tokens = [];
        let pos = 0;
        let len = text.length;
        while (pos < len) {
            // Find the next tag
            // Find [
            let TagLeft = text.indexOf("[", pos);
            if (TagLeft === -1) {
                // no more tags, add the rest of the text
                tokens.push({
                    type: BB_TokenType.TEXT,
                    attributes: { _text: text.substring(pos) }
                });
                break;
            }
            if (TagLeft > pos) {
                // add the text before the [
                tokens.push({
                    type: BB_TokenType.TEXT,
                    attributes: { _text: text.substring(pos, TagLeft) }
                });
            }
            // find ]
            let TagRight = text.indexOf("]", TagLeft);
            let nextTagLeft = text.indexOf("[", TagLeft + 1);
            // make sure there is no [ between the [ and ]
            if (nextTagLeft > 0 && nextTagLeft < TagRight)
                return null;
            // make sure there is a ] after the [
            if (TagRight === -1)
                return null;
            let tag_content = text.substring(TagLeft + 1, TagRight);
            tokens.push(BB_Lexer.parse_tag_content(tag_content));
            pos = TagRight + 1;
        }
        return tokens;
    }
}
class BB_multiline {
    static from_BBCode(text, linespace = "1em") {
        var _a;
        let tspans = [];
        let tag_stack = [];
        let tokens = BB_Lexer.parse(text);
        if (tokens === null) {
            console.error("Invalid BBCode");
            return [];
        }
        for (let token of tokens) {
            switch (token.type) {
                case BB_TokenType.OPEN_TAG:
                    {
                        // if the token is [br] then add a new line
                        if (token.attributes['_tag_name'] === "br") {
                            const style = BB_multiline.build_style(tag_stack);
                            const dy = (_a = style['_line-height']) !== null && _a !== void 0 ? _a : linespace;
                            tspans.push({ text: "\n", style: { dy } });
                            break;
                        }
                        tag_stack.push(token.attributes);
                    }
                    break;
                case BB_TokenType.CLOSE_TAG:
                    {
                        if (tag_stack.length === 0) {
                            console.error("Invalid BBCode");
                            return [];
                        }
                        let tag_top = tag_stack[tag_stack.length - 1];
                        if (tag_top['_tag_name'] !== token.attributes['_tag_name']) {
                            console.error("Invalid BBCode");
                            return [];
                        }
                        tag_stack.pop();
                    }
                    break;
                case BB_TokenType.TEXT:
                    {
                        let style = BB_multiline.build_style(tag_stack);
                        tspans.push({ text: token.attributes['_text'], style });
                    }
                    break;
            }
        }
        return tspans;
    }
    static split_tspans_by_words(text_span_data) {
        let new_text_span_data = [];
        for (let span of text_span_data) {
            const text = span.text;
            let words = text.split(" ");
            for (let i = 0; i < words.length - 1; i++)
                words[i] += " ";
            for (let word of words) {
                new_text_span_data.push({ text: word, style: JSON.parse(JSON.stringify(span.style)) });
            }
        }
        return new_text_span_data;
    }
    static build_style(tag_stack) {
        let style = {};
        for (let tag of tag_stack) {
            switch (tag['_tag_name']) {
                case "b":
                    style["font-weight"] = "bold";
                    break;
                case "i":
                    style["font-style"] = "italic";
                    break;
                case "color":
                    style["fill"] = tag["color"];
                    break;
                case "size":
                    style["font-size"] = tag["size"];
                    break;
                case "dx":
                    style["dx"] = tag["dx"];
                    break;
                case "dy":
                    style["dy"] = tag["dy"];
                    break;
                case "font":
                    style["font-family"] = tag["font"];
                    break;
                case "var":
                    style["textvar"] = true;
                    break;
                case "tag":
                    style["tag"] = tag["tag"];
                    break;
                case "lineheight":
                    style["_line-height"] = tag["lineheight"];
                    break;
                case "sup":
                    {
                        style["baseline-shift"] = "super";
                        style["font-size-scale-factor"] = 0.7;
                        style["is-prev-word"] = true;
                    }
                    break;
                case "sub":
                    {
                        style["baseline-shift"] = "-20%";
                        style["font-size-scale-factor"] = 0.7;
                        style["is-prev-word"] = true;
                    }
                    break;
            }
        }
        return style;
    }
}

/*
* For objects that contain children, having a tag is useful so that the children can be easily accessed.
*/
var TAG;
(function (TAG) {
    TAG["EMPTY"] = "empty";
    TAG["LINE"] = "line";
    TAG["CIRCLE"] = "circle";
    TAG["TEXTVAR"] = "textvar";
    // prefix
    TAG["ROW_"] = "row_";
    TAG["COL_"] = "col_";
    // arrow
    TAG["ARROW_LINE"] = "arrow_line";
    TAG["ARROW_HEAD"] = "arrow_head";
    // table
    TAG["TABLE"] = "table";
    TAG["CONTAIN_TABLE"] = "contain_table";
    TAG["TABLE_CELL"] = "table_cell";
    TAG["TABLE_CONTENT"] = "table_content";
    TAG["EMPTY_CELL"] = "empty_cell";
    //graph
    TAG["GRAPH_AXIS"] = "graph_axis_line";
    TAG["GRAPH_TICK"] = "graph_tick";
    TAG["GRAPH_TICK_LABEL"] = "graph_tick_label";
    TAG["GRAPH_GRID"] = "graph_grid";
})(TAG || (TAG = {}));

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
var DiagramType;
(function (DiagramType) {
    DiagramType["Polygon"] = "polygon";
    DiagramType["Curve"] = "curve";
    DiagramType["Text"] = "text";
    DiagramType["Image"] = "image";
    DiagramType["Diagram"] = "diagram";
    DiagramType["MultilineText"] = "multilinetext";
})(DiagramType || (DiagramType = {}));
const DEFAULT_FONTSIZE = "16"; // 16px (12pt) is the web default
function anchor_to_textdata(anchor) {
    // TODO : might want to look at
    // hanging vs text-before-edge
    // ideographic vs text-after-edge
    switch (anchor) {
        case "top-left": return { "text-anchor": "start", "dy": "0.75em" };
        case "top-center": return { "text-anchor": "middle", "dy": "0.75em" };
        case "top-right": return { "text-anchor": "end", "dy": "0.75em" };
        case "center-left": return { "text-anchor": "start", "dy": "0.25em" };
        case "center-center": return { "text-anchor": "middle", "dy": "0.25em" };
        case "center-right": return { "text-anchor": "end", "dy": "0.25em" };
        case "bottom-left": return { "text-anchor": "start", "dy": "-0.25em" };
        case "bottom-center": return { "text-anchor": "middle", "dy": "-0.25em" };
        case "bottom-right": return { "text-anchor": "end", "dy": "-0.25em" };
        default: throw new Error("Unknown anchor " + anchor);
    }
}
/**
* Diagram Class
*
* Diagram is a tree structure
* Diagram can be a polygon, curve, text, image, or diagram
* Polygon is a closed path
* Curve is an open path
* Diagram is a tree of Diagrams
*/
class Diagram {
    constructor(type_, args = {}) {
        this.children = [];
        this.path = undefined; // Polygon and Curve have a path
        this.origin = new Vector2(0, 0); // position of the origin of the diagram
        this.style = {};
        this.textdata = {};
        this.multilinedata = {};
        this.imgdata = {};
        this.mutable = false;
        this.tags = [];
        this._bbox_cache = undefined;
        this.type = type_;
        this.path = args.path;
        if (args.children) {
            this.children = args.children;
        }
        if (args.textdata) {
            this.textdata = args.textdata;
        }
        if (args.imgdata) {
            this.imgdata = args.imgdata;
        }
        if (args.tags) {
            this.tags = args.tags;
        }
        if (args.multilinedata) {
            this.multilinedata = args.multilinedata;
        }
    }
    /**
     * Turn the diagram into a mutable diagram
     */
    mut() {
        this.mutable = true;
        // make path mutable
        if (this.path != undefined)
            this.path.mutable = true;
        // make all of the children mutable
        for (let i = 0; i < this.children.length; i++)
            this.children[i].mut();
        return this;
    }
    mut_parent_only() {
        this.mutable = true;
        // make path mutable
        if (this.path != undefined)
            this.path.mutable = true;
        return this;
    }
    /**
     * Create a copy of the diagram that is immutable
     */
    immut() {
        let newd = this.copy();
        newd.mutable = false;
        // make path immutable
        if (this.path != undefined)
            this.path.mutable = false;
        // make all of the children immutable
        for (let i = 0; i < newd.children.length; i++)
            newd.children[i].immut();
        return newd;
    }
    static deep_setPrototypeOf(obj) {
        Object.setPrototypeOf(obj, Diagram.prototype);
        let objd = obj;
        // convert position and origin_offset to Vector2
        objd.origin = Object.setPrototypeOf(objd.origin, Vector2.prototype);
        // make sure all of the children are Diagram
        for (let c = 0; c < objd.children.length; c++)
            Diagram.deep_setPrototypeOf(objd.children[c]);
        // set path to Path
        if (objd.path != undefined) {
            Object.setPrototypeOf(objd.path, Path.prototype);
            objd.path = objd.path.copy();
        }
        // bbox cache 
        if (objd._bbox_cache != undefined && objd._bbox_cache.length == 2) {
            Object.setPrototypeOf(objd._bbox_cache[0], Vector2.prototype);
            Object.setPrototypeOf(objd._bbox_cache[1], Vector2.prototype);
        }
    }
    /**
     * Copy the diagram
     * @return { Diagram }
     */
    copy() {
        // do deepcopy with JSON
        let newd = JSON.parse(JSON.stringify(this));
        // turn newd into Diagram
        Diagram.deep_setPrototypeOf(newd);
        return newd;
    }
    copy_if_not_mutable() {
        return this.mutable ? this : this.copy();
    }
    /**
     * Append tags to the diagram
     */
    append_tags(tags) {
        let newd = this.copy_if_not_mutable();
        if (!Array.isArray(tags))
            tags = [tags];
        for (let tag of tags) {
            if (!newd.tags.includes(tag))
                newd.tags.push(tag);
        }
        return newd;
    }
    /**
     * Remove tags from the diagram
     */
    remove_tags(tags) {
        let newd = this.copy_if_not_mutable();
        newd.tags = newd.tags.filter(t => !tags.includes(t));
        return newd;
    }
    /**
     * Reset all tags of the diagram
     */
    reset_tags() {
        let newd = this.copy_if_not_mutable();
        newd.tags = [];
        return newd;
    }
    /**
    * Check if the diagram contains a tag
    */
    contain_tag(tag) {
        return this.tags.includes(tag);
    }
    contain_all_tags(tags) {
        for (let tag of tags) {
            if (!this.tags.includes(tag))
                return false;
        }
        return true;
    }
    /**
     * Collect all children and subchildren of the diagram
     * helper function for flatten()
     */
    collect_children() {
        let children = [];
        if (this.type == DiagramType.Diagram) {
            for (let c of this.children) {
                children = children.concat(c.collect_children());
            }
        }
        else {
            children.push(this);
        }
        return children;
    }
    /**
     * Flatten the children structure of the diagram
     * so that the diagram only has one level of children
     * \* implemented for performance reason
     */
    flatten() {
        let newd = this.copy_if_not_mutable();
        newd.children = newd.collect_children();
        return newd;
    }
    /**
     * Apply a function to the diagram
     * @param func function to apply
     * func takes in a diagram and returns a diagram
     */
    apply(func) {
        return func(this.copy_if_not_mutable());
    }
    /**
     * Apply a function to the diagram and all of its children recursively
     * @param func function to apply
     * func takes in a diagram and returns a diagram
     */
    apply_recursive(func) {
        let newd = this.copy_if_not_mutable();
        // apply to self
        newd = func(newd);
        // apply to children
        for (let i = 0; i < newd.children.length; i++) {
            newd.children[i] = newd.children[i].apply_recursive(func);
        }
        return newd;
    }
    /**
    * Apply a function to the diagram and all of its children recursively
    * The function is only applied to the diagrams that contain a specific tag
    * @param tags the tag to filter the diagrams
    * @param func function to apply
    * func takes in a diagram and returns a diagram
    */
    apply_to_tagged_recursive(tags, func) {
        if (!Array.isArray(tags))
            tags = [tags];
        let newd = this.copy_if_not_mutable();
        // if the diagram has the tag, apply the function to self
        if (newd.contain_all_tags(tags))
            newd = func(newd);
        // apply to children
        for (let i = 0; i < newd.children.length; i++) {
            newd.children[i] = newd.children[i].apply_to_tagged_recursive(tags, func);
        }
        return newd;
    }
    /**
    * Get all the diagrams that contain a specific tag
    * @param tags the tag to filter the diagrams
    * @return a list of diagrams
    */
    get_tagged_elements(tags) {
        if (!Array.isArray(tags))
            tags = [tags];
        let result = [];
        if (this.contain_all_tags(tags))
            result.push(this.copy_if_not_mutable());
        for (let i = 0; i < this.children.length; i++) {
            result = result.concat(this.children[i].get_tagged_elements(tags));
        }
        return result;
    }
    /**
     * Combine another diagram with this diagram
     * @param diagrams a diagram or a list of diagrams
     */
    combine(...diagrams) {
        return diagram_combine(this, ...diagrams);
    }
    /**
     * Convert the diagram to a curve
     * If the diagram is a polygon, convert it to a curve
     * If the diagram is a Diagram, convert all of the children to curves
     */
    to_curve() {
        let newd = this.copy_if_not_mutable();
        if (newd.type == DiagramType.Polygon) {
            newd.type = DiagramType.Curve;
        }
        else if (newd.type == DiagramType.Diagram) {
            // newd.children = newd.children.map(c => c.to_curve());
            for (let i = 0; i < newd.children.length; i++)
                newd.children[i] = newd.children[i].to_curve();
        }
        return newd;
    }
    /**
     * Convert the diagram to a polygon
     * If the diagram is a curve, convert it to a polygon
     * If the diagram is a Diagram, convert all of the children to polygons
     */
    to_polygon() {
        let newd = this.copy_if_not_mutable();
        if (newd.type == DiagramType.Curve) {
            newd.type = DiagramType.Polygon;
        }
        else if (newd.type == DiagramType.Diagram) {
            // newd.children = newd.children.map(c => c.to_polygon());
            for (let i = 0; i < newd.children.length; i++)
                newd.children[i] = newd.children[i].to_polygon();
        }
        return newd;
    }
    /**
     * Add points to the diagram
     * if the diagram is a polygon or curve, add points to the path
     * if the diagram is a diagram, add points to the last polygon or curve child
     * @param points points to add
     */
    add_points(points) {
        let newd = this.copy_if_not_mutable();
        if (newd.type == DiagramType.Polygon || newd.type == DiagramType.Curve) {
            if (newd.path == undefined) {
                throw new Error(this.type + " must have a path");
            }
            newd.path = newd.path.add_points(points);
        }
        else if (newd.type == DiagramType.Diagram) {
            // add point to the last polygon or curve child
            let last_child = newd.children[newd.children.length - 1];
            newd.children[newd.children.length - 1] = last_child.add_points(points);
        }
        return newd;
    }
    update_style(stylename, stylevalue, excludedType) {
        let newd = this.copy_if_not_mutable();
        if (excludedType === null || excludedType === void 0 ? void 0 : excludedType.includes(newd.type)) {
            return newd;
        }
        else if (newd.type == DiagramType.Polygon || newd.type == DiagramType.Curve
            || newd.type == DiagramType.Text || newd.type == DiagramType.Image
            || newd.type == DiagramType.MultilineText) {
            if (stylename === "fill") {
                newd.style[stylename] = stylevalue;
            }
            else {
                newd.style[stylename] = stylevalue;
            }
        }
        else if (newd.type == DiagramType.Diagram) {
            // newd.children = newd.children.map(c => c.update_style(stylename, stylevalue, excludedType));
            for (let i = 0; i < newd.children.length; i++)
                newd.children[i] = newd.children[i].update_style(stylename, stylevalue, excludedType);
        }
        else {
            throw new Error("Unreachable, unknown diagram type : " + newd.type);
        }
        return newd;
    }
    /* * Clone style from another diagram */
    clone_style_from(diagram) {
        return this.apply_recursive(d => {
            d.style = Object.assign({}, diagram.style);
            return d;
        });
    }
    fill(color) {
        return this.update_style('fill', color, [DiagramType.Text]);
    }
    stroke(color) {
        return this.update_style('stroke', color, [DiagramType.Text]);
    }
    opacity(opacity) {
        return this.update_style('opacity', opacity.toString());
    }
    strokewidth(width) {
        return this.update_style('stroke-width', width.toString(), [DiagramType.Text]);
    }
    strokelinecap(linecap) {
        return this.update_style('stroke-linecap', linecap);
    }
    strokelinejoin(linejoin) {
        return this.update_style('stroke-linejoin', linejoin);
    }
    strokedasharray(dasharray) {
        return this.update_style('stroke-dasharray', dasharray.join(','));
    }
    vectoreffect(vectoreffect) {
        return this.update_style('vector-effect', vectoreffect);
    }
    filter(filter) {
        return this.update_style('filter', `url(#${filter})`);
    }
    textfill(color) {
        return this.update_style('fill', color, [DiagramType.Polygon, DiagramType.Curve]);
    }
    textstroke(color) {
        return this.update_style('stroke', color, [DiagramType.Polygon, DiagramType.Curve]);
    }
    textstrokewidth(width) {
        return this.update_style('stroke-width', width.toString(), [DiagramType.Polygon, DiagramType.Curve]);
    }
    update_textdata(textdataname, textdatavalue) {
        let newd = this.copy_if_not_mutable();
        if (newd.type == DiagramType.Text || newd.type == DiagramType.MultilineText) {
            newd.textdata[textdataname] = textdatavalue;
        }
        else if (newd.type == DiagramType.Diagram) {
            // newd.children = newd.children.map(c => c.update_textdata(textdataname, textdatavalue));
            for (let i = 0; i < newd.children.length; i++)
                newd.children[i] = newd.children[i].update_textdata(textdataname, textdatavalue);
        }
        else if (newd.type == DiagramType.Polygon || newd.type == DiagramType.Curve) ;
        else {
            throw new Error("Unreachable, unknown diagram type : " + newd.type);
        }
        return newd;
    }
    fontfamily(fontfamily) {
        return this.update_textdata('font-family', fontfamily);
    }
    fontstyle(fontstyle) {
        return this.update_textdata('font-style', fontstyle);
    }
    fontsize(fontsize) {
        return this.update_textdata('font-size', fontsize.toString());
    }
    fontweight(fontweight) {
        return this.update_textdata('font-weight', fontweight.toString());
    }
    fontscale(fontscale) {
        return this.update_textdata('font-scale', fontscale.toString());
    }
    textanchor(textanchor) {
        return this.update_textdata('text-anchor', textanchor);
    }
    textdy(dy) {
        return this.update_textdata('dy', dy);
    }
    textangle(angle) {
        return this.update_textdata('angle', angle.toString());
    }
    text_tovar() {
        let newd = this.copy_if_not_mutable();
        if (newd.type == DiagramType.Text) {
            newd = newd.append_tags(TAG.TEXTVAR);
        }
        else if (newd.type == DiagramType.Diagram) {
            // newd.children = newd.children.map(c => c.text_tovar());
            for (let i = 0; i < newd.children.length; i++)
                newd.children[i] = newd.children[i].text_tovar();
        }
        return newd;
    }
    text_totext() {
        let newd = this.copy_if_not_mutable();
        if (newd.type == DiagramType.Text) {
            newd = newd.remove_tags('textvar');
        }
        else if (newd.type == DiagramType.Diagram) {
            // newd.children = newd.children.map(c => c.text_totext());
            for (let i = 0; i < newd.children.length; i++)
                newd.children[i] = newd.children[i].text_totext();
        }
        return newd;
    }
    /**
     * Get the bounding box of the diagram
     * @returns [min, max] where min is the top left corner and max is the bottom right corner
     */
    bounding_box() {
        if (this._bbox_cache != undefined)
            return this._bbox_cache;
        let minx = Infinity, miny = Infinity;
        let maxx = -Infinity, maxy = -Infinity;
        if (this.type == DiagramType.Diagram) {
            for (let c = 0; c < this.children.length; c++) {
                let child = this.children[c];
                let [min, max] = child.bounding_box();
                minx = Math.min(minx, min.x);
                miny = Math.min(miny, min.y);
                maxx = Math.max(maxx, max.x);
                maxy = Math.max(maxy, max.y);
            }
            const bbox = [new Vector2(minx, miny), new Vector2(maxx, maxy)];
            this._bbox_cache = bbox;
            return bbox;
        }
        else if (this.type == DiagramType.Curve || this.type == DiagramType.Polygon
            || this.type == DiagramType.Image) {
            if (this.path == undefined) {
                throw new Error(this.type + " must have a path");
            }
            for (let p = 0; p < this.path.points.length; p++) {
                let point = this.path.points[p];
                minx = Math.min(minx, point.x);
                miny = Math.min(miny, point.y);
                maxx = Math.max(maxx, point.x);
                maxy = Math.max(maxy, point.y);
            }
            const bbox = [new Vector2(minx, miny), new Vector2(maxx, maxy)];
            this._bbox_cache = bbox;
            return bbox;
        }
        else if (this.type == DiagramType.Text || this.type == DiagramType.MultilineText) {
            const bbox = [this.origin.copy(), this.origin.copy()];
            this._bbox_cache = bbox;
            return bbox;
        }
        else {
            throw new Error("Unreachable, unknown diagram type : " + this.type);
        }
    }
    /**
     * Transform the diagram by a function
     * @param transform_function function to transform the diagram
     */
    transform(transform_function) {
        let newd = this.copy_if_not_mutable();
        newd._bbox_cache = undefined;
        // transform all children
        // newd.children = newd.children.map(c => c.transform(transform_function));
        for (let i = 0; i < newd.children.length; i++)
            newd.children[i] = newd.children[i].transform(transform_function);
        // transform path
        if (newd.path != undefined)
            newd.path = newd.path.transform(transform_function);
        // transform origin
        newd.origin = transform_function(newd.origin);
        return newd;
    }
    /**
     * Translate the diagram by a vector
     * @param v vector to translate
     */
    translate(v) {
        // return this.transform(Transform.translate(v));
        const prev_cached_bbox = this._bbox_cache;
        const newd = this.transform(Transform.translate(v));
        if (prev_cached_bbox != undefined) {
            newd._bbox_cache = prev_cached_bbox.map(p => Transform.translate(v)(p));
        }
        return newd;
    }
    /**
     * move the diagram to a position
     * @param v position to move to (if left undefined, move to the origin)
     */
    position(v = new Vector2(0, 0)) {
        let dv = v.sub(this.origin);
        return this.translate(dv);
    }
    /**
     * Rotate the diagram by an angle around a pivot
     * @param angle angle to rotate
     * @param pivot pivot point, if left undefined, rotate around the origin
     */
    rotate(angle, pivot = undefined) {
        if (pivot == undefined) {
            pivot = this.origin;
        }
        return this.transform(Transform.rotate(angle, pivot));
    }
    /**
     * Scale the diagram by a scale around a origin
     * @param scale scale to scale (x, y)
     * @param origin origin point, if left undefined, scale around the origin
     */
    scale(scale, origin) {
        if (origin == undefined) {
            origin = this.origin;
        }
        if (typeof scale == 'number') {
            scale = new Vector2(scale, scale);
        }
        return this.transform(Transform.scale(scale, origin));
    }
    /**
     * Scale texts contained in the diagram by a scale
     * @param scale scaling factor
     */
    scaletext(scale) {
        return this.apply_recursive(d => {
            switch (d.type) {
                case DiagramType.Text: {
                    let fontsize = parseFloat(d.textdata['font-size'] || DEFAULT_FONTSIZE);
                    let newd = d.copy_if_not_mutable();
                    newd.textdata['font-size'] = (fontsize * scale).toString();
                    return newd;
                }
                case DiagramType.MultilineText: {
                    let newd = d.copy_if_not_mutable();
                    newd.multilinedata['scale-factor'] = (newd.multilinedata['scale-factor'] || 1) * scale;
                    return newd;
                }
                default: return d;
            }
        });
    }
    /**
     * Skew the diagram in the x direction by an angle around a base
     * @param angle angle to skew
     * @param base base point, if left undefined, skew around the origin
     */
    skewX(angle, base) {
        if (base == undefined) {
            base = this.origin;
        }
        return this.transform(Transform.skewX(angle, base.y));
    }
    /**
     * Skew the diagram in the y direction by an angle around a base
     * @param angle angle to skew
     * @param base base point, if left undefined, skew around the origin
     */
    skewY(angle, base) {
        if (base == undefined) {
            base = this.origin;
        }
        return this.transform(Transform.skewY(angle, base.x));
    }
    /**
     * Reflect the diagram over a point
     * @param p point to reflect over
     */
    reflect_over_point(p) {
        return this.transform(Transform.reflect_over_point(p));
    }
    /**
     * Reflect the diagram over a line defined by two points
     * @param p1 point on the line
     * @param p2 point on the line
     */
    reflect_over_line(p1, p2) {
        return this.transform(Transform.reflect_over_line(p1, p2));
    }
    /**
     * Reflect the diagram
     * if given 0 arguments, reflect over the origin
     * if given 1 argument, reflect over a point p1
     * if given 2 arguments, reflect over a line defined by two points p1 and p2
     * @param p1 point
     * @param p2 point
     */
    reflect(p1, p2) {
        if (p1 == undefined && p2 == undefined) {
            return this.reflect_over_point(this.origin);
        }
        else if (p1 != undefined && p2 == undefined) {
            return this.reflect_over_point(p1);
        }
        else if (p1 != undefined && p2 != undefined) {
            return this.reflect_over_line(p1, p2);
        }
        else {
            throw new Error("Unreachable");
        }
    }
    /**
     * Vertical flip
     * Reflect the diagram over a horizontal line y = a
     * @param a y value of the line
     * if left undefined, flip over the origin
     */
    vflip(a) {
        if (a == undefined) {
            a = this.origin.y;
        }
        return this.reflect(new Vector2(0, a), new Vector2(1, a));
    }
    /**
     * Horizontal flip
     * Reflect the diagram over a vertical line x = a
     * @param a x value of the line
     * if left undefined, flip over the origin
     */
    hflip(a) {
        if (a == undefined) {
            a = this.origin.x;
        }
        return this.reflect(new Vector2(a, 0), new Vector2(a, 1));
    }
    /**
     * Get the position of the anchor of the diagram
     * @param anchor anchor to get, anchors can be
     *   'top-left', 'top-center', 'top-right'
     *   'center-left', 'center-center', 'center-right'
     *   'bottom-left', 'bottom-center', 'bottom-right'
     * @returns the position of the anchor
     */
    get_anchor(anchor) {
        let [min, max] = this.bounding_box();
        let minx = min.x, miny = min.y;
        let maxx = max.x, maxy = max.y;
        let midx = (minx + maxx) / 2;
        let midy = (miny + maxy) / 2;
        switch (anchor) {
            case "top-left": return new Vector2(minx, maxy);
            case "top-center": return new Vector2(midx, maxy);
            case "top-right": return new Vector2(maxx, maxy);
            case "center-left": return new Vector2(minx, midy);
            case "center-center": return new Vector2(midx, midy);
            case "center-right": return new Vector2(maxx, midy);
            case "bottom-left": return new Vector2(minx, miny);
            case "bottom-center": return new Vector2(midx, miny);
            case "bottom-right": return new Vector2(maxx, miny);
            default: throw new Error("Unknown anchor " + anchor);
        }
    }
    /**
     * Move the origin of the diagram to a position or anchor
     * @param pos position to move the origin to (Vector2), or anchor to move the origin to.
     * anchors can be
     *  'top-left', 'top-center', 'top-right'
     *  'center-left', 'center-center', 'center-right'
     *  'bottom-left', 'bottom-center', 'bottom-right'
     * * for texts, use `move_origin_text()`
     */
    move_origin(pos) {
        let newd = this.copy_if_not_mutable();
        if (pos instanceof Vector2) {
            newd.origin = pos;
        }
        else {
            newd.origin = newd.get_anchor(pos);
        }
        return newd;
    }
    /**
     * Move the origin of text diagram to an anchor
     * @param anchor anchor to move the origin to.
     * anchors can be
     * 'top-left', 'top-center', 'top-right'
     * 'center-left', 'center-center', 'center-right'
     * 'bottom-left', 'bottom-center', 'bottom-right'
     */
    __move_origin_text(anchor) {
        // for text, use text-anchor and dominant-baseline
        let newd = this.copy_if_not_mutable();
        let textdata = anchor_to_textdata(anchor);
        newd.textdata['text-anchor'] = textdata['text-anchor'];
        newd.textdata['dy'] = textdata['dy'];
        return newd;
    }
    /**
     * Move the origin of text diagram to a position
     * @param anchor anchor to move the origin to.
     * anchors can be
     * 'top-left', 'top-center', 'top-right'
     * 'center-left', 'center-center', 'center-right'
     * 'bottom-left', 'bottom-center', 'bottom-right'
     *
     */
    move_origin_text(anchor) {
        let newd = this.copy_if_not_mutable();
        if (this.type == DiagramType.Text || this.type == DiagramType.MultilineText) {
            newd = newd.__move_origin_text(anchor);
        }
        else if (this.type == DiagramType.Diagram) {
            //newd.children = newd.children.map(c => c.move_origin_text(anchor));
            for (let i = 0; i < newd.children.length; i++)
                newd.children[i] = newd.children[i].move_origin_text(anchor);
        }
        else ;
        return newd;
    }
    path_length() {
        if (this.type == DiagramType.Diagram) {
            let length = 0;
            for (let c = 0; c < this.children.length; c++) {
                length += this.children[c].path_length();
            }
            return length;
        }
        else if (this.type == DiagramType.Curve || this.type == DiagramType.Polygon) {
            if (this.path == undefined) {
                throw new Error(this.type + " must have a path");
            }
            return this.path.length();
        }
        else {
            throw new Error("Unreachable, unknown diagram type : " + this.type);
        }
    }
    /**
    * Reverse the order of the points in the path
    */
    reverse_path() {
        var _a;
        let newd = this.copy_if_not_mutable();
        if (newd.path) {
            newd.path = (_a = newd.path) === null || _a === void 0 ? void 0 : _a.reverse();
        }
        return newd;
    }
    /**
     * Get the point on the path at t
     * Path can be described parametrically in the form of (x(t), y(t))
     * Path starts at t=0 and ends at t=1
     * @param t parameter
     * @param segment_index (only works for polygon and curves)
     * If segment_index (n) is defined, get the point at the nth segment
     * If segment_index (n) is defined, t can be outside of [0, 1] and will return the extrapolated point
     * @returns the position of the point
     */
    parametric_point(t, segment_index) {
        if (this.type == DiagramType.Diagram) {
            // use entire length, use the childrens
            let cumuative_length = [];
            let length = 0.0;
            for (let c = 0; c < this.children.length; c++) {
                length += this.children[c].path_length();
                cumuative_length.push(length);
            }
            let total_length = length;
            let cumulative_t = cumuative_length.map(l => l / total_length);
            // figure out which children t is in
            for (let i = 0; i < cumulative_t.length; i++) {
                if (t <= cumulative_t[i]) {
                    let child_id = i;
                    let prev_t = (i == 0) ? 0 : cumulative_t[i - 1];
                    let segment_t = (t - prev_t) / (cumulative_t[i] - prev_t);
                    return this.children[child_id].parametric_point(segment_t);
                }
            }
            throw Error("Unreachable");
        }
        else if (this.type == DiagramType.Curve) {
            // get the point on the path
            if (this.path == undefined) {
                throw new Error(this.type + " must have a path");
            }
            return this.path.parametric_point(t, false, segment_index);
        }
        else if (this.type == DiagramType.Polygon) {
            // get the point on the path
            if (this.path == undefined) {
                throw new Error(this.type + " must have a path");
            }
            return this.path.parametric_point(t, true, segment_index);
        }
        else {
            throw new Error("Unreachable, unknown diagram type : " + this.type);
        }
    }
    debug_bbox() {
        // TODO : let user supply the styling function
        let style_bbox = (d) => {
            return d.fill('none').stroke('gray').strokedasharray([5, 5]);
        };
        let [min, max] = this.bounding_box();
        let rect_bbox = polygon([
            new Vector2(min.x, min.y), new Vector2(max.x, min.y),
            new Vector2(max.x, max.y), new Vector2(min.x, max.y)
        ]).apply(style_bbox);
        let origin_x = text('+').position(this.origin);
        return rect_bbox.combine(origin_x);
    }
    debug(show_index = true) {
        // TODO : let user supply the styling function
        let style_path = (d) => {
            return d.fill('none').stroke('red').strokedasharray([5, 5]);
        };
        let style_index = (d) => {
            let bg = d.textfill('white').textstroke('white').textstrokewidth(5);
            let dd = d.fill('black');
            return bg.combine(dd);
        };
        // handle each type separately
        if (this.type == DiagramType.Diagram) {
            return this.debug_bbox();
        }
        else if (this.type == DiagramType.Text) {
            // return empty at diagram origin
            return empty(this.origin);
        }
        else if (this.type == DiagramType.Polygon || this.type == DiagramType.Curve
            || this.type == DiagramType.Image) {
            let f_obj = this.type == DiagramType.Polygon || DiagramType.Image ? polygon : curve;
            let deb_bbox = this.debug_bbox();
            if (this.path == undefined) {
                throw new Error(this.type + " must have a path");
            }
            let deb_object = f_obj(this.path.points).apply(style_path);
            // if show_index is false, return only the bbox and polygon
            if (show_index == false) {
                return deb_bbox.combine(deb_object);
            }
            // iterate for all path points
            let points = this.path.points;
            // let point_texts = points.map((p, i) => text(i.toString()).position(p).apply(style_index));
            let point_texts = [];
            let prev_point = undefined;
            let [min, max] = this.bounding_box();
            let minimum_dist_tolerance = Math.min(max.x - min.x, max.y - min.y) / 10;
            for (let i = 0; i < points.length; i++) {
                // push to point_texts only if far enough from prev_point
                let dist_to_prev = prev_point == undefined ? Infinity : points[i].sub(prev_point).length();
                if (dist_to_prev < minimum_dist_tolerance)
                    continue;
                point_texts.push(text(i.toString()).position(points[i]).apply(style_index));
                prev_point = points[i];
            }
            return deb_bbox.combine(deb_object, ...point_texts);
        }
        else {
            throw new Error("Unreachable, unknown diagram type : " + this.type);
        }
    }
    is_empty() {
        return this.contain_tag(TAG.EMPTY);
    }
}
class Path {
    constructor(points) {
        this.points = points;
        this.mutable = false;
    }
    copy() {
        let newpoints = this.points.map(p => new Vector2(p.x, p.y));
        return new Path(newpoints);
    }
    copy_if_not_mutable() {
        return this.mutable ? this : this.copy();
    }
    /**
    * Reverse the order of the points in the path
    */
    reverse() {
        let newp = this.copy_if_not_mutable();
        newp.points = newp.points.reverse();
        return newp;
    }
    /**
     * Get the length of the path
     */
    length() {
        let length = 0;
        for (let i = 1; i < this.points.length; i++) {
            length += this.points[i].sub(this.points[i - 1]).length();
        }
        return length;
    }
    /**
     * add points to the path
     * @param points points to add
     */
    add_points(points) {
        let newp = this.copy_if_not_mutable();
        newp.points = newp.points.concat(points);
        return newp;
    }
    /**
     * Get the point on the path at t
     * Path can be described parametrically in the form of (x(t), y(t))
     * Path starts at t=0 and ends at t=1
     * @param t parameter
     * @param closed if true, the path is closed
     * @param segment_index
     * If `segment_index` (n) is defined, get the point at the nth segment.
     * If `segment_index` (n) is defined, t can be outside of [0, 1] and will return the extrapolated point.
     * @returns the position of the point
    */
    parametric_point(t, closed = false, segment_index) {
        let extended_points = this.points;
        if (closed)
            extended_points = this.points.concat(this.points[0]);
        // for a closed path, there's an extra segment connecting the last point to the first point
        if (segment_index == undefined) {
            if (t < 0 || t > 1) {
                throw Error("t must be between 0 and 1");
            }
            // use entire length
            let cumulative_length = [];
            let length = 0.0;
            for (let i = 1; i < extended_points.length; i++) {
                length += extended_points[i].sub(extended_points[i - 1]).length();
                cumulative_length.push(length);
            }
            let total_length = length;
            let cumulative_t = cumulative_length.map(l => l / total_length);
            // figure out which segment t is in
            for (let i = 0; i < cumulative_t.length; i++) {
                if (t <= cumulative_t[i]) {
                    let segment_id = i;
                    let prev_t = (i == 0) ? 0 : cumulative_t[i - 1];
                    let segment_t = (t - prev_t) / (cumulative_t[i] - prev_t);
                    return this.parametric_point(segment_t, closed, segment_id);
                }
            }
            // segment must have been retrieved at this point
            throw Error("Unreachable");
        }
        else {
            // take nth segment
            if (segment_index < 0 || segment_index > extended_points.length - 1) {
                throw Error("segment_index must be between 0 and n-1");
            }
            let start = extended_points[segment_index];
            let end = extended_points[segment_index + 1];
            let dir = end.sub(start);
            return start.add(dir.scale(t));
        }
    }
    /**
     * Tranfrom the path by a function
     * @param transform_function function to transform the path
     */
    transform(transform_function) {
        let newp = this.copy_if_not_mutable();
        // transform all the points
        // newp.points = newp.points.map(p => transform_function(p));
        for (let i = 0; i < newp.points.length; i++)
            newp.points[i] = transform_function(newp.points[i]);
        return newp;
    }
}
/**
 * Combine multiple diagrams into one diagram
 * @param diagrams list of diagrams to combine
 * @returns a diagram
 */
function diagram_combine(...diagrams) {
    if (diagrams.length == 0) {
        return empty();
    }
    let newdiagrams = diagrams.map(d => d.copy_if_not_mutable());
    // check if all children is mutable
    // if they are, then set the new diagram to be mutable
    let all_children_mutable = true;
    for (let i = 0; i < newdiagrams.length; i++) {
        if (!newdiagrams[i].mutable) {
            all_children_mutable = false;
            break;
        }
    }
    let newd = new Diagram(DiagramType.Diagram, { children: newdiagrams });
    newd.mutable = all_children_mutable;
    return newd.move_origin(diagrams[0].origin);
    // return newd.move_origin(Anchor.CenterCenter);
    // i think it's better to keep the origin at the origin of the first diagram
}
// ====== function helpers to create primitives =========
/**
 * Create a curve from a list of points
 * @param points list of points
 * @returns a curve diagram
 */
function curve(points) {
    let path = new Path(points);
    let curve = new Diagram(DiagramType.Curve, { path: path });
    return curve;
}
/**
 * Create a line from start to end
 * @param start start point
 * @param end end point
 * @returns a line diagram
 */
function line$1(start, end) {
    return curve([start, end]).append_tags(TAG.LINE);
}
/**
 * Create a polygon from a list of points
 * @param points list of points
 * @returns a polygon diagram
 */
function polygon(points) {
    assert(points.length >= 3, "Polygon must have at least 3 points");
    let path = new Path(points);
    // create diagram
    let polygon = new Diagram(DiagramType.Polygon, { path: path });
    return polygon;
}
/**
 * Create an empty diagram, contain just a single point
 * @param v position of the point
 * @returns an empty diagram
 */
function empty(v = V2(0, 0)) {
    let emp = curve([v]).append_tags(TAG.EMPTY);
    return emp;
}
/**
 * Create a text diagram
 * @param str text to display
 * @returns a text diagram
 */
function text(str) {
    let dtext = new Diagram(DiagramType.Text, {
        textdata: { text: str, "font-size": DEFAULT_FONTSIZE },
        path: new Path([new Vector2(0, 0)]),
    });
    return dtext;
}
/**
 * Create an image diagram
 * @param src image source
 * @param width width of the image
 * @param height height of the image
 * @returns an image diagram
 */
function image(src, width, height) {
    let imgdata = { src };
    // path: bottom-left, bottom-right, top-right, top-left
    let path = new Path([
        V2(-width / 2, -height / 2), V2(width / 2, -height / 2),
        V2(width / 2, height / 2), V2(-width / 2, height / 2),
    ]);
    let img = new Diagram(DiagramType.Image, { imgdata: imgdata, path: path });
    return img;
}
/**
 * Create a multiline text diagram
 * @param strs list of text to display
 */
function multiline(spans) {
    var _a;
    let tspans = [];
    for (let i = 0; i < spans.length; i++) {
        let text = spans[i][0];
        let style = (_a = spans[i][1]) !== null && _a !== void 0 ? _a : {};
        tspans.push({ text, style });
    }
    let dmulti = new Diagram(DiagramType.MultilineText, {
        multilinedata: { content: tspans, "scale-factor": 1 },
        path: new Path([new Vector2(0, 0)]),
    });
    return dmulti;
}
function multiline_bb(bbstr, linespace, split_by_word = false) {
    let tspans = BB_multiline.from_BBCode(bbstr, linespace);
    if (split_by_word)
        tspans = BB_multiline.split_tspans_by_words(tspans);
    let dmulti = new Diagram(DiagramType.MultilineText, {
        multilinedata: { content: tspans, "scale-factor": 1 },
        path: new Path([new Vector2(0, 0)]),
    });
    return dmulti;
}

// color from matpltlib's tab20
const tab_color = {
    'blue': '#1f77b4',
    'lightblue': '#aec7e8',
    'orange': '#ff7f0e',
    'lightorange': '#ffbb78',
    'green': '#2ca02c',
    'lightgreen': '#98df8a',
    'red': '#d62728',
    'lightred': '#ff9896',
    'purple': '#9467bd',
    'lightpurple': '#c5b0d5',
    'brown': '#8c564b',
    'lightbrown': '#c49c94',
    'pink': '#e377c2',
    'lightpink': '#f7b6d2',
    'grey': '#7f7f7f',
    'lightgrey': '#c7c7c7',
    'gray': '#7f7f7f',
    'lightgray': '#c7c7c7',
    'olive': '#bcbd22',
    'lightolive': '#dbdb8d',
    'cyan': '#17becf',
    'lightcyan': '#9edae5',
};
function get_color(colorname, palette) {
    var _a;
    return (_a = palette[colorname]) !== null && _a !== void 0 ? _a : colorname;
}

/**
 * Helper function to convert from degrees to radians
 */
function to_radian(angle) {
    return angle * Math.PI / 180;
}
/**
 * Helper function to convert from radians to degrees
 */
function to_degree(angle) {
    return angle * 180 / Math.PI;
}
function array_repeat(arr, len) {
    let new_arr = [];
    for (let i = 0; i < len; i++) {
        new_arr.push(arr[i % arr.length]);
    }
    return new_arr;
}
/**
 * Create a equivalently spaced array of numbers from start to end (inclusive)
 * [start, end]
 * @param start start value
 * @param end end value
 * @param n number of points
 */
function linspace(start, end, n = 100) {
    let result = [];
    let step = (end - start) / (n - 1);
    for (let i = 0; i < n; i++) {
        result.push(start + step * i);
    }
    return result;
}
/**
 * Create a equivalently spaced array of numbers from start to end (exclusice)
 * [start, end)
 * @param start start value
 * @param end end value
 * @param n number of points
 */
function linspace_exc(start, end, n = 100) {
    let result = [];
    let step = (end - start) / n;
    for (let i = 0; i < n; i++) {
        result.push(start + step * i);
    }
    return result;
}
/**
 * Create a equivalently spaced array of numbers from start to end (exclusive)
 * [start, end)
 * @param start start value
 * @param end end value
 * @param step step size
 */
function range(start, end, step = 1) {
    // step cannot be 0 and cannot be in the wrong direction
    if (step == 0)
        return [];
    let n = Math.floor((end - start) / step);
    if (n <= 0)
        return [];
    let result = [];
    if (step > 0) {
        for (let i = start; i < end; i += step) {
            result.push(i);
        }
    }
    else {
        for (let i = start; i > end; i += step) {
            result.push(i);
        }
    }
    return result;
}
/**
 * Create a equivalently spaced array of numbers from start to end (inc)
 * [start, end]
 * @param start start value
 * @param end end value
 * @param step step size
 */
function range_inc(start, end, step = 1) {
    // step cannot be 0 and cannot be in the wrong direction
    if (step == 0)
        return [];
    let n = Math.floor((end - start) / step);
    if (n <= 0)
        return [];
    let result = [];
    if (step > 0) {
        for (let i = start; i <= end; i += step) {
            result.push(i);
        }
    }
    else {
        for (let i = start; i >= end; i += step) {
            result.push(i);
        }
    }
    return result;
}
/**
 * Transpose a 2D array
 * if the array is not a rectangle, the transposed array will be padded with undefined
 * @param arr 2D array
 * @returns transposed 2D array
 */
function transpose(arr) {
    let result = [];
    let n = Math.max(...arr.map(a => a.length));
    for (let i = 0; i < n; i++) {
        result.push([]);
        for (let j = 0; j < arr.length; j++) {
            result[i].push(arr[j][i]);
        }
    }
    return result;
}
/* @return [top, right, bottom, left] */
function expand_directional_value(padding) {
    let p = padding;
    if (typeof p === 'number')
        return [p, p, p, p];
    if (!Array.isArray(p))
        return [0, 0, 0, 0];
    if (p.length === 1)
        return [p[0], p[0], p[0], p[0]];
    if (p.length === 2)
        return [p[0], p[1], p[0], p[1]];
    if (p.length === 3)
        return [p[0], p[1], p[2], p[1]];
    if (p.length >= 4)
        return [p[0], p[1], p[2], p[3]];
    return [0, 0, 0, 0];
}

var utils = /*#__PURE__*/Object.freeze({
    __proto__: null,
    array_repeat: array_repeat,
    expand_directional_value: expand_directional_value,
    linspace: linspace,
    linspace_exc: linspace_exc,
    range: range,
    range_inc: range_inc,
    to_degree: to_degree,
    to_radian: to_radian,
    transpose: transpose
});

const unicode_mathematical_italic = {
    'A': '𝐴', 'B': '𝐵', 'C': '𝐶', 'D': '𝐷', 'E': '𝐸',
    'F': '𝐹', 'G': '𝐺', 'H': '𝐻', 'I': '𝐼', 'J': '𝐽',
    'K': '𝐾', 'L': '𝐿', 'M': '𝑀', 'N': '𝑁', 'O': '𝑂',
    'P': '𝑃', 'Q': '𝑄', 'R': '𝑅', 'S': '𝑆', 'T': '𝑇',
    'U': '𝑈', 'V': '𝑉', 'W': '𝑊', 'X': '𝑋', 'Y': '𝑌', 'Z': '𝑍',
    'a': '𝑎', 'b': '𝑏', 'c': '𝑐', 'd': '𝑑', 'e': '𝑒',
    'f': '𝑓', 'g': '𝑔', 'h': 'ℎ', 'i': '𝑖', 'j': '𝑗',
    'k': '𝑘', 'l': '𝑙', 'm': '𝑚', 'n': '𝑛', 'o': '𝑜',
    'p': '𝑝', 'q': '𝑞', 'r': '𝑟', 's': '𝑠', 't': '𝑡',
    'u': '𝑢', 'v': '𝑣', 'w': '𝑤', 'x': '𝑥', 'y': '𝑦', 'z': '𝑧',
    'Α': '𝛢', 'Β': '𝛣', 'Γ': '𝛤', 'Δ': '𝛥', 'Ε': '𝛦',
    'Ζ': '𝛧', 'Η': '𝛨', 'Θ': '𝛩', 'Ι': '𝛪', 'Κ': '𝛫',
    'Λ': '𝛬', 'Μ': '𝛭', 'Ν': '𝛮', 'Ξ': '𝛯', 'Ο': '𝛰',
    'Π': '𝛱', 'Ρ': '𝛲', 'Σ': '𝛴', 'Τ': '𝛵', 'Υ': '𝛶',
    'Φ': '𝛷', 'Χ': '𝛸', 'Ψ': '𝛹', 'Ω': '𝛺',
    'α': '𝛼', 'β': '𝛽', 'γ': '𝛾', 'δ': '𝛿', 'ε': '𝜀',
    'ζ': '𝜁', 'η': '𝜂', 'θ': '𝜃', 'ι': '𝜄', 'κ': '𝜅',
    'λ': '𝜆', 'μ': '𝜇', 'ν': '𝜈', 'ξ': '𝜉', 'ο': '𝜊',
    'π': '𝜋', 'ρ': '𝜌', 'ς': '𝜍', 'σ': '𝜎', 'τ': '𝜏', 'υ': '𝜐',
    'φ': '𝜑', 'χ': '𝜒', 'ψ': '𝜓', 'ω': '𝜔',
    'ϑ': '𝜗', 'ϰ': '𝜘', 'ϕ': '𝜙', 'ϱ': '𝜚', 'ϖ': '𝜛',
    // '.' : '𝛻', '.' : '𝛳', '.' : '𝜕', '.' : '𝜖',
};
Object.fromEntries(Object.entries(unicode_mathematical_italic).map(([k, v]) => [v, k]));
const latex_greek = {
    '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ', '\\epsilon': 'ε',
    '\\zeta': 'ζ', '\\eta': 'η', '\\theta': 'θ', '\\iota': 'ι', '\\kappa': 'κ',
    '\\lambda': 'λ', '\\mu': 'μ', '\\nu': 'ν', '\\xi': 'ξ', '\\omicron': 'ο',
    '\\pi': 'π', '\\rho': 'ρ', '\\sigma': 'σ', '\\tau': 'τ', '\\upsilon': 'υ',
    '\\phi': 'ϕ', '\\chi': 'χ', '\\psi': 'ψ', '\\omega': 'ω',
    '\\vartheta': 'ϑ', '\\varchi': 'ϰ', '\\varphi': 'φ', '\\varepsilon': 'ε',
    '\\varrho': 'ϱ', '\\varsigma': 'ς',
};
const latex_symbols = {
    "textfractionsolidus": "⁄",
    "leftrightsquigarrow": "↭",
    "textpertenthousand": "‱",
    "blacktriangleright": "▸",
    "blacktriangledown": "▾",
    "blacktriangleleft": "◂",
    "twoheadrightarrow": "↠",
    "leftrightharpoons": "⇋",
    "rightleftharpoons": "⇌",
    "textreferencemark": "※",
    "circlearrowright": "↻",
    "rightrightarrows": "⇉",
    "vartriangleright": "⊳",
    "textordmasculine": "º",
    "textvisiblespace": "␣",
    "twoheadleftarrow": "↞",
    "downharpoonright": "⇂",
    "ntrianglerighteq": "⋭",
    "rightharpoondown": "⇁",
    "textperthousand": "‰",
    "leftrightarrows": "⇆",
    "textmusicalnote": "♪",
    "nleftrightarrow": "↮",
    "rightleftarrows": "⇄",
    "bigtriangledown": "▽",
    "textordfeminine": "ª",
    "ntrianglelefteq": "⋬",
    "rightthreetimes": "⋌",
    "trianglerighteq": "⊵",
    "vartriangleleft": "⊲",
    "rightsquigarrow": "⇝",
    "downharpoonleft": "⇃",
    "curvearrowright": "↷",
    "circlearrowleft": "↺",
    "leftharpoondown": "↽",
    "nLeftrightarrow": "⇎",
    "curvearrowleft": "↶",
    "guilsinglright": "›",
    "leftthreetimes": "⋋",
    "leftrightarrow": "↔",
    "rightharpoonup": "⇀",
    "guillemotright": "»",
    "downdownarrows": "⇊",
    "hookrightarrow": "↪",
    "dashrightarrow": "⇢",
    "leftleftarrows": "⇇",
    "trianglelefteq": "⊴",
    "ntriangleright": "⋫",
    "doublebarwedge": "⌆",
    "upharpoonright": "↾",
    "rightarrowtail": "↣",
    "looparrowright": "↬",
    "Leftrightarrow": "⇔",
    "sphericalangle": "∢",
    "divideontimes": "⋇",
    "measuredangle": "∡",
    "blacktriangle": "▴",
    "ntriangleleft": "⋪",
    "mathchar1356": "⁁",
    "texttrademark": "™",
    "mathchar2208": "⌖",
    "triangleright": "▹",
    "leftarrowtail": "↢",
    "guilsinglleft": "‹",
    "upharpoonleft": "↿",
    "mathbb{gamma}": "ℽ",
    "fallingdotseq": "≒",
    "looparrowleft": "↫",
    "textbrokenbar": "¦",
    "hookleftarrow": "↩",
    "smallsetminus": "﹨",
    "dashleftarrow": "⇠",
    "guillemotleft": "«",
    "leftharpoonup": "↼",
    "mathbb{Gamma}": "ℾ",
    "bigtriangleup": "△",
    "textcircledP": "℗",
    "risingdotseq": "≓",
    "triangleleft": "◃",
    "mathsterling": "£",
    "textcurrency": "¤",
    "triangledown": "▿",
    "blacklozenge": "",
    "sfrac{5}{6}": "⅚",
    "preccurlyeq": "≼",
    "Rrightarrow": "⇛",
    "circledcirc": "⊚",
    "nRightarrow": "⇏",
    "sfrac{3}{8}": "⅜",
    "sfrac{1}{3}": "⅓",
    "sfrac{2}{5}": "⅖",
    "vartriangle": "▵",
    "Updownarrow": "⇕",
    "nrightarrow": "↛",
    "sfrac{1}{2}": "½",
    "sfrac{3}{5}": "⅗",
    "succcurlyeq": "≽",
    "sfrac{4}{5}": "⅘",
    "diamondsuit": "♦",
    "sfrac{1}{6}": "⅙",
    "curlyeqsucc": "⋟",
    "blacksquare": "▪",
    "curlyeqprec": "⋞",
    "sfrac{1}{8}": "⅛",
    "sfrac{7}{8}": "⅞",
    "sfrac{1}{5}": "⅕",
    "sfrac{2}{3}": "⅔",
    "updownarrow": "↕",
    "backepsilon": "∍",
    "circleddash": "⊝",
    "eqslantless": "⋜",
    "sfrac{3}{4}": "¾",
    "sfrac{5}{8}": "⅝",
    "sfrac{1}{4}": "¼",
    "mathbb{Pi}": "ℿ",
    "mathcal{M}": "ℳ",
    "mathcal{o}	": "ℴ",
    "mathcal{O}	": "𝒪",
    "nsupseteqq": "⊉",
    "mathcal{B}": "ℬ",
    "textrecipe": "℞",
    "nsubseteqq": "⊈",
    "subsetneqq": "⊊",
    "mathcal{I}": "ℑ",
    "upuparrows": "⇈",
    "mathcal{e}": "ℯ",
    "mathcal{L}": "ℒ",
    "nleftarrow": "↚",
    "mathcal{H}": "ℋ",
    "mathcal{E}": "ℰ",
    "eqslantgtr": "⋝",
    "curlywedge": "⋏",
    "varepsilon": "ε",
    "supsetneqq": "⊋",
    "rightarrow": "→",
    "mathcal{R}": "ℛ",
    "sqsubseteq": "⊑",
    "mathcal{g}": "ℊ",
    "sqsupseteq": "⊒",
    "complement": "∁",
    "Rightarrow": "⇒",
    "gtreqqless": "⋛",
    "lesseqqgtr": "⋚",
    "circledast": "⊛",
    "nLeftarrow": "⇍",
    "Lleftarrow": "⇚",
    "varnothing": "∅",
    "mathcal{N}": "𝒩",
    "Leftarrow": "⇐",
    "gvertneqq": "≩",
    "mathbb{C}": "ℂ",
    "supsetneq": "⊋",
    "leftarrow": "←",
    "nleqslant": "≰",
    "mathbb{Q}": "ℚ",
    "mathbb{Z}": "ℤ",
    "llbracket": "〚",
    "mathbb{H}": "ℍ",
    "spadesuit": "♠",
    "mathit{o}": "ℴ",
    "mathbb{P}": "ℙ",
    "rrbracket": "〛",
    "supseteqq": "⊇",
    "copyright": "©",
    "textsc{k}": "ĸ",
    "gtreqless": "⋛",
    "mathbb{j}": "ⅉ",
    "pitchfork": "⋔",
    "estimated": "℮",
    "ngeqslant": "≱",
    "mathbb{e}": "ⅇ",
    "therefore": "∴",
    "triangleq": "≜",
    "varpropto": "∝",
    "subsetneq": "⊊",
    "heartsuit": "♥",
    "mathbb{d}": "ⅆ",
    "lvertneqq": "≨",
    "checkmark": "✓",
    "nparallel": "∦",
    "mathbb{R}": "ℝ",
    "lesseqgtr": "⋚",
    "downarrow": "↓",
    "mathbb{D}": "ⅅ",
    "mathbb{i}": "ⅈ",
    "backsimeq": "⋍",
    "mathbb{N}": "ℕ",
    "Downarrow": "⇓",
    "subseteqq": "⊆",
    "setminus": "∖",
    "succnsim": "⋩",
    "doteqdot": "≑",
    "clubsuit": "♣",
    "emptyset": "∅",
    "sqsupset": "⊐",
    "fbox{~~}": "▭",
    "curlyvee": "⋎",
    "varkappa": "ϰ",
    "llcorner": "⌞",
    "varsigma": "ς",
    "approxeq": "≊",
    "backcong": "≌",
    "supseteq": "⊇",
    "circledS": "Ⓢ",
    "circledR": "®",
    "textcent": "¢",
    "urcorner": "⌝",
    "lrcorner": "⌟",
    "boxminus": "⊟",
    "texteuro": "€",
    "vartheta": "ϑ",
    "barwedge": "⊼",
    "ding{86}": "✶",
    "sqsubset": "⊏",
    "subseteq": "⊆",
    "intercal": "⊺",
    "ding{73}": "☆",
    "ulcorner": "⌜",
    "recorder": "⌕",
    "precnsim": "⋨",
    "parallel": "∥",
    "boxtimes": "⊠",
    "ding{55}": "✗",
    "multimap": "⊸",
    "maltese": "✠",
    "nearrow": "↗",
    "swarrow": "↙",
    "lozenge": "◊",
    "sqrt[3]": "∛",
    "succsim": "≿",
    "dotplus": "∔",
    "tilde{}": "~",
    "check{}": "ˇ",
    "lessgtr": "≶",
    "Upsilon": "ϒ",
    "Cdprime": "Ъ",
    "gtrless": "≷",
    "backsim": "∽",
    "nexists": "∄",
    "searrow": "↘",
    "lessdot": "⋖",
    "boxplus": "⊞",
    "upsilon": "υ",
    "epsilon": "ε",
    "diamond": "⋄",
    "bigstar": "★",
    "ddagger": "‡",
    "cdprime": "ъ",
    "Uparrow": "⇑",
    "sqrt[4]": "∜",
    "between": "≬",
    "sqangle": "∟",
    "digamma": "Ϝ",
    "uparrow": "↑",
    "nwarrow": "↖",
    "precsim": "≾",
    "breve{}": "˘",
    "because": "∵",
    "bigcirc": "◯",
    "acute{}": "´",
    "grave{}": "`",
    "lesssim": "≲",
    "partial": "∂",
    "natural": "♮",
    "supset": "⊃",
    "hstrok": "ħ",
    "Tstrok": "Ŧ",
    "coprod": "∐",
    "models": "⊧",
    "otimes": "⊗",
    "degree": "°",
    "gtrdot": "⋗",
    "preceq": "≼",
    "Lambda": "Λ",
    "lambda": "λ",
    "cprime": "ь",
    "varrho": "ϱ",
    "Bumpeq": "≎",
    "hybull": "⁃",
    "lmidot": "ŀ",
    "nvdash": "⊬",
    "lbrace": "{",
    "bullet": "•",
    "varphi": "φ",
    "bumpeq": "≏",
    "ddot{}": "¨",
    "Lmidot": "Ŀ",
    "Cprime": "Ь",
    "female": "♀",
    "rtimes": "⋊",
    "gtrsim": "≳",
    "mapsto": "↦",
    "daleth": "ℸ",
    "square": "■",
    "nVDash": "⊯",
    "rangle": "⟩",
    "tstrok": "ŧ",
    "oslash": "⊘",
    "ltimes": "⋉",
    "lfloor": "⌊",
    "marker": "▮",
    "Subset": "⋐",
    "Vvdash": "⊪",
    "propto": "∝",
    "Hstrok": "Ħ",
    "dlcrop": "⌍",
    "forall": "∀",
    "nVdash": "⊮",
    "Supset": "⋑",
    "langle": "⟨",
    "ominus": "⊖",
    "rfloor": "⌋",
    "circeq": "≗",
    "eqcirc": "≖",
    "drcrop": "⌌",
    "veebar": "⊻",
    "ulcrop": "⌏",
    "nvDash": "⊭",
    "urcrop": "⌎",
    "exists": "∃",
    "approx": "≈",
    "dagger": "†",
    "boxdot": "⊡",
    "succeq": "≽",
    "bowtie": "⋈",
    "subset": "⊂",
    "notin": "∉",
    "Sigma": "Σ",
    "Omega": "Ω",
    "nabla": "∇",
    "colon": ":",
    "boxHu": "╧",
    "boxHd": "╤",
    "aleph": "ℵ",
    "gnsim": "⋧",
    "boxHU": "╩",
    "boxHD": "╦",
    "equiv": "≡",
    "lneqq": "≨",
    "alpha": "α",
    "amalg": "∐",
    "boxhU": "╨",
    "boxhD": "╥",
    "uplus": "⊎",
    "boxhu": "┴",
    "kappa": "κ",
    "sigma": "σ",
    "boxDL": "╗",
    "Theta": "Θ",
    "Vdash": "⊩",
    "boxDR": "╔",
    "boxDl": "╖",
    "sqcap": "⊓",
    "boxDr": "╓",
    "bar{}": "¯",
    "dashv": "⊣",
    "vDash": "⊨",
    "boxdl": "┐",
    "boxVl": "╢",
    "boxVh": "╫",
    "boxVr": "╟",
    "boxdr": "┌",
    "boxdL": "╕",
    "boxVL": "╣",
    "boxVH": "╬",
    "boxVR": "╠",
    "boxdR": "╒",
    "theta": "θ",
    "lhblk": "▄",
    "uhblk": "▀",
    "ldotp": ".",
    "ldots": "…",
    "boxvL": "╡",
    "boxvH": "╪",
    "boxvR": "╞",
    "boxvl": "┤",
    "boxvh": "┼",
    "boxvr": "├",
    "Delta": "Δ",
    "boxUR": "╚",
    "boxUL": "╝",
    "oplus": "⊕",
    "boxUr": "╙",
    "boxUl": "╜",
    "doteq": "≐",
    "happy": "㋡",
    "varpi": "ϖ",
    "smile": "☺",
    "boxul": "┘",
    "simeq": "≃",
    "boxuR": "╘",
    "boxuL": "╛",
    "boxhd": "┬",
    "gimel": "ℷ",
    "Gamma": "Γ",
    "lnsim": "⋦",
    "sqcup": "⊔",
    "omega": "ω",
    "sharp": "♯",
    "times": "×",
    "block": "█",
    "hat{}": "^",
    "wedge": "∧",
    "vdash": "⊢",
    "angle": "∠",
    "infty": "∞",
    "gamma": "γ",
    "asymp": "≍",
    "rceil": "⌉",
    "dot{}": "˙",
    "lceil": "⌈",
    "delta": "δ",
    "gneqq": "≩",
    "frown": "⌢",
    "phone": "☎",
    "vdots": "⋮",
    "boxr": "└",
    "k{i}": "į",
    "`{I}": "Ì",
    "perp": "⊥",
    "\"{o}": "ö",
    "={I}": "Ī",
    "`{a}": "à",
    "v{T}": "Ť",
    "surd": "√",
    "H{O}": "Ő",
    "vert": "|",
    "k{I}": "Į",
    "\"{y}": "ÿ",
    "\"{O}": "Ö",
    "u{u}": "ў",
    "u{G}": "Ğ",
    ".{E}": "Ė",
    ".{z}": "ż",
    "v{t}": "ť",
    "prec": "≺",
    "H{o}": "ő",
    "mldr": "…",
    "cong": "≅",
    ".{e}": "ė",
    "star": "*",
    ".{Z}": "Ż",
    "geqq": "≧",
    "cdot": "⋅",
    "cdots": "…",
    "`{U}": "Ù",
    "v{L}": "Ľ",
    "c{s}": "ş",
    "~{A}": "Ã",
    "Vert": "‖",
    "k{e}": "ę",
    "lnot": "¬",
    "leqq": "≦",
    "beta": "β",
    "beth": "ℶ",
    "~{n}": "ñ",
    "u{i}": "й",
    "c{S}": "Ş",
    "c{N}": "Ņ",
    "H{u}": "ű",
    "v{n}": "ň",
    "={U}": "Ū",
    "~{O}": "Õ",
    "v{E}": "Ě",
    "H{U}": "Ű",
    "v{N}": "Ň",
    "prod": "∏",
    "v{s}": "š",
    "\"{U}": "Ü",
    "c{n}": "ņ",
    "k{U}": "Ų",
    "c{R}": "Ŗ",
    "~{o}": "õ",
    "v{e}": "ě",
    "v{S}": "Š",
    "u{A}": "Ă",
    "circ": "∘",
    "\"{u}": "ü",
    "flat": "♭",
    "v{z}": "ž",
    "r{U}": "Ů",
    "`{O}": "Ò",
    "={u}": "ū",
    "oint": "∮",
    "c{K}": "Ķ",
    "k{u}": "ų",
    "not<": "≮",
    "not>": "≯",
    "`{o}": "ò",
    "\"{I}": "Ï",
    "v{D}": "Ď",
    ".{G}": "Ġ",
    "r{u}": "ů",
    "not=": "≠",
    "`{u}": "ù",
    "v{c}": "č",
    "c{k}": "ķ",
    ".{g}": "ġ",
    "odot": "⊙",
    "`{e}": "э",
    "c{T}": "Ţ",
    "v{d}": "ď",
    "\"{e}": "ё",
    "v{R}": "Ř",
    "k{a}": "ą",
    "nldr": "‥",
    "`{A}": "À",
    "~{N}": "Ñ",
    "nmid": "∤",
    ".{C}": "Ċ",
    "zeta": "ζ",
    "~{u}": "ũ",
    "`{E}": "Э",
    "~{a}": "ã",
    "c{t}": "ţ",
    "={o}": "ō",
    "v{r}": "ř",
    "={A}": "Ā",
    ".{c}": "ċ",
    "~{U}": "Ũ",
    "k{A}": "Ą",
    "\"{a}": "ä",
    "u{U}": "Ў",
    "iota": "ι",
    "={O}": "Ō",
    "c{C}": "Ç",
    "gneq": "≩",
    "boxH": "═",
    "hbar": "ℏ",
    "\"{A}": "Ä",
    "boxv": "│",
    "boxh": "─",
    "male": "♂",
    "sqrt": "√",
    "succ": "≻",
    "c{c}": "ç",
    "v{l}": "ľ",
    "u{a}": "ă",
    "v{Z}": "Ž",
    "c{G}": "Ģ",
    "v{C}": "Č",
    "lneq": "≨",
    "{E}": "Ё",
    "={a}": "ā",
    "c{l}": "ļ",
    "={E}": "Ē",
    "boxV": "║",
    "u{g}": "ğ",
    "u{I}": "Й",
    "c{L}": "Ļ",
    "k{E}": "Ę",
    ".{I}": "İ",
    "~{I}": "Ĩ",
    "c{r}": "ŗ",
    "{Y}": "Ÿ",
    "={e}": "ē",
    "leq": "≤",
    "Cup": "⋓",
    "Psi": "Ψ",
    "neq": "≠",
    "k{}": "˛",
    "={}": "‾",
    "H{}": "˝",
    "cup": "∪",
    "geq": "≥",
    "mho": "℧",
    "Dzh": "Џ",
    "cap": "∩",
    "bot": "⊥",
    "psi": "ψ",
    "chi": "χ",
    "c{}": "¸",
    "Phi": "Φ",
    "ast": "*",
    "ell": "ℓ",
    "top": "⊤",
    "lll": "⋘",
    "tau": "τ",
    "Cap": "⋒",
    "sad": "☹",
    "iff": "⇔",
    "eta": "η",
    "eth": "ð",
    "d{": "	̣",
    "rho": "ρ",
    "dzh": "џ",
    "div": "÷",
    "phi": "ϕ",
    "Rsh": "↱",
    "vee": "∨",
    "b{}": "ˍ",
    "t{": "	͡",
    "int": "∫",
    "sim": "∼",
    "r{}": "˚",
    "Lsh": "↰",
    "yen": "¥",
    "ggg": "⋙",
    "mid": "∣",
    "sum": "∑",
    "neg": "¬",
    "Dz": "Ѕ",
    "Re": "ℜ",
    "oe": "œ",
    "DH": "Ð",
    "ll": "≪",
    "ng": "ŋ",
    "wr": "≀",
    "wp": "℘",
    "=I": "І",
    ":)": "☺",
    ":(": "☹",
    "AE": "Æ",
    "AA": "Å",
    "ss": "ß",
    "dz": "ѕ",
    "ae": "æ",
    "aa": "å",
    "th": "þ",
    "to": "→",
    "Pi": "Π",
    "mp": "∓",
    "Im": "ℑ",
    "pm": "±",
    "pi": "π",
    "\"I": "Ї",
    "in": "∈",
    "ni": "∋",
    "ne": "≠",
    "TH": "Þ",
    "Xi": "Ξ",
    "nu": "ν",
    "NG": "Ŋ",
    ":G": "㋡",
    "xi": "ξ",
    "OE": "Œ",
    "gg": "≫",
    "DJ": "Đ",
    "=e": "є",
    "=E": "Є",
    "mu": "μ",
    "dj": "đ",
    // "&" : "&",
    // "$" : "$",
    // "%" : "%",
    // "#" : "#",
    // "-" : "­",
    "S": "§",
    "P": "¶",
    "O": "Ø",
    "L": "Ł",
    // "}" : "}",
    "o": "ø",
    "l": "ł",
    "h": "ℎ",
    "i": "ℹ",
    // "-" : "−",
    "'{Y}": "Ý",
    "'{y}": "ý",
    "'{L}": "Ĺ",
    "'{e}": "é",
    "'{l}": "ĺ",
    "'{s}": "ś",
    "'{z}": "ź",
    "'{E}": "É",
    "'{S}": "Ś",
    "'{Z}": "Ź",
    "'{R}": "Ŕ",
    "'{A}": "Á",
    "'{N}": "Ń",
    "'{I}": "Í",
    "'{n}": "ń",
    "'{c}": "ć",
    "'{u}": "ú",
    "'{C}": "Ć",
    "'{o}": "ó",
    "'{a}": "á",
    "'{O}": "Ó",
    "'{g}": "ǵ",
    "'{r}": "ŕ",
    "'{U}": "Ú",
    "'G": "Ѓ",
    "'C": "Ћ",
    "'K": "Ќ",
    "'k": "ќ",
    "'c": "ћ",
    "'g": "ѓ",
};
function str_latex_to_unicode(str) {
    str = str;
    for (let key in latex_greek) {
        str = str.replaceAll(key, latex_greek[key]);
    }
    for (let key in latex_symbols) {
        str = str.replaceAll('\\' + key, latex_symbols[key]);
    }
    return str;
}
function str_to_mathematical_italic(str) {
    return [...str_latex_to_unicode(str)]
        .map(c => unicode_mathematical_italic[c] || c).join('');
}

// TODO : add guard for the dictionary key
// since the implementation is using `for (let stylename in style)` without checking
// if the correct key is in the dictionary, it can lead to unintended behavior
// for example, `font-size` could be defined in default_text_diagram_style
// and will shadow the `font-size` in default_diagram_style
const default_diagram_style = {
    "fill": "none",
    "stroke": "black",
    "stroke-width": "1",
    "stroke-linecap": "butt",
    "stroke-dasharray": "none",
    "stroke-linejoin": "round",
    "vector-effect": "non-scaling-stroke",
    "opacity": "1",
};
const _init_default_diagram_style = Object.assign({}, default_diagram_style);
const default_text_diagram_style = {
    "fill": "black",
    "stroke": "none",
    "stroke-width": "1",
    "stroke-linecap": "butt",
    "stroke-dasharray": "none",
    "stroke-linejoin": "round",
    "vector-effect": "non-scaling-stroke",
    "opacity": "1",
};
const _init_default_text_diagram_style = Object.assign({}, default_text_diagram_style);
const default_textdata = {
    "text": "",
    "font-family": "Latin Modern Math, sans-serif",
    "font-size": DEFAULT_FONTSIZE,
    "font-weight": "normal",
    "text-anchor": "middle",
    "dy": "0.25em",
    "angle": "0",
    "font-style": "normal",
    "font-scale": "auto",
};
const _init_default_textdata = Object.assign({}, default_textdata);
function reset_default_styles() {
    for (let s in default_diagram_style)
        default_diagram_style[s] = _init_default_diagram_style[s];
    for (let s in default_text_diagram_style)
        default_text_diagram_style[s] = _init_default_text_diagram_style[s];
    for (let s in default_textdata)
        default_textdata[s] = _init_default_textdata[s];
}
function isLinearGradient(fill) {
    return typeof fill === "object" && fill.type === "linearGradient";
}
function draw_polygon(svgelement, target_element, diagram, svgtag) {
    // get properties
    let style = Object.assign(Object.assign({}, default_diagram_style), diagram.style); // use default if not defined
    style.fill = get_color(style.fill, tab_color);
    style.stroke = get_color(style.stroke, tab_color);
    // add def
    let defs = svgelement.querySelector('defs');
    if (!defs) {
        defs = document.createElementNS("http://www.w3.org/2000/svg", 'defs');
        svgelement.appendChild(defs);
    }
    if (isLinearGradient(style.fill)) {
        // create gradient
        const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;
        const gradient = document.createElementNS("http://www.w3.org/2000/svg", 'linearGradient');
        let { x1, x2, y1, y2 } = style.fill;
        gradient.setAttribute("id", gradientId);
        gradient.setAttribute("x1", x1 || "0%");
        gradient.setAttribute("y1", y1 || "0%");
        gradient.setAttribute("x2", x2 || "100%");
        gradient.setAttribute("y2", y2 || "0%");
        style.fill.stops.forEach(stop => {
            const stopElement = document.createElementNS("http://www.w3.org/2000/svg", "stop");
            stopElement.setAttribute("offset", stop.offset);
            stopElement.setAttribute("stop-color", get_color(stop.color, tab_color));
            if (stop.opacity !== undefined) {
                stopElement.setAttribute("stop-opacity", stop.opacity.toString());
            }
            gradient.appendChild(stopElement);
        });
        defs.appendChild(gradient);
        style.fill = `url(#${gradientId})`;
    }
    else {
        style.fill = get_color(style.fill, tab_color);
    }
    // draw svg
    let polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    for (let stylename in style) {
        polygon.style[stylename] = style[stylename];
    }
    if (svgtag != undefined)
        polygon.setAttribute("_dg_tag", svgtag);
    // polygon.style.fill = color_fill;
    // polygon.style.stroke = color_stroke;
    // use tab_color color palette
    target_element.appendChild(polygon);
    if (diagram.path != undefined) {
        for (let i = 0; i < diagram.path.points.length; i++) {
            let p = diagram.path.points[i];
            var point = svgelement.createSVGPoint();
            point.x = p.x;
            point.y = -p.y;
            polygon.points.appendItem(point);
        }
    }
}
function draw_curve(svgelement, target_element, diagram, svgtag) {
    // get properties
    let style = Object.assign(Object.assign({}, default_diagram_style), diagram.style); // use default if not defined
    style.fill = "none";
    style.stroke = get_color(style.stroke, tab_color);
    // draw svg
    let polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    for (let stylename in style) {
        polyline.style[stylename] = style[stylename];
    }
    if (svgtag != undefined)
        polyline.setAttribute("_dg_tag", svgtag);
    target_element.appendChild(polyline);
    if (diagram.path != undefined) {
        for (let i = 0; i < diagram.path.points.length; i++) {
            let p = diagram.path.points[i];
            var point = svgelement.createSVGPoint();
            point.x = p.x;
            point.y = -p.y;
            polyline.points.appendItem(point);
        }
    }
}
function is_dataURL(url) {
    // Regular expression to check for data URL
    const dataUrlPattern = /^data:image\/(png|jpeg|jpg|gif|svg\+xml);base64,/;
    return dataUrlPattern.test(url);
}
const _IMAGE_DATAURL_CACHE_MAP = new Map();
/**
 * Convert image href to data url
 * This is necessary so that the image diagram can be downloaded as png
 */
function set_image_href_dataURL(img, src) {
    // if it is already a dataURL, just set it
    if (is_dataURL(src)) {
        img.setAttribute("href", src);
        img.setAttribute("xlink:href", src);
        return;
    }
    // if it's already cached, just set it
    if (_IMAGE_DATAURL_CACHE_MAP.has(src)) {
        const dataURL = _IMAGE_DATAURL_CACHE_MAP.get(src);
        if (!dataURL)
            return;
        // dataURL can be undefined, indicating it's still loading or
        // the image is not found
        img.setAttribute("href", dataURL);
        img.setAttribute("xlink:href", dataURL);
        return;
    }
    // _IMAGE_DATAURL_CACHE_MAP.set(src, undefined);
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext('2d');
    let base_image = new Image();
    base_image.crossOrigin = "anonymous";
    base_image.onload = () => {
        canvas.height = base_image.height;
        canvas.width = base_image.width;
        ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(base_image, 0, 0);
        // NOTE : we need to set both href and xlink:href for compatibility reason
        // most browser already deprecate xlink:href because of SVG 2.0
        // but other browser and image viewer/editor still only support xlink:href
        // might be removed in the future
        const dataURL = canvas.toDataURL("image/png");
        img.setAttribute("href", dataURL);
        img.setAttribute("xlink:href", dataURL);
        _IMAGE_DATAURL_CACHE_MAP.set(src, dataURL);
        canvas.remove();
    };
    base_image.src = src;
}
/**
 * if `embed_image` is `true`, the image will be embedded as dataURL
 * this allow the image to be downloaded as SVG with the image embedded
 */
function draw_image(target_element, diagram, embed_image, svgtag) {
    let image = document.createElementNS("http://www.w3.org/2000/svg", "image");
    image.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    if (diagram.imgdata.src == undefined)
        return;
    // make sure path is defined and have 4 points
    if (diagram.path == undefined)
        return;
    if (diagram.path.points.length != 4)
        return;
    // it's calculated like this to be able to apply linear transformation
    // path: bottom-left, bottom-right, top-right, top-left
    // width  : 0-1
    // height : 1-2
    let width = diagram.path.points[1].sub(diagram.path.points[0]).length();
    let height = diagram.path.points[2].sub(diagram.path.points[1]).length();
    // calculate the linear transformation matrix
    // [ a c ]
    // [ b d ]
    let ex = diagram.path.points[1].sub(diagram.path.points[0]).normalize();
    let ey = diagram.path.points[3].sub(diagram.path.points[0]).normalize();
    let a = ex.x;
    let b = -ex.y;
    let c = -ey.x;
    let d = ey.y;
    let xpos = diagram.path.points[3].x;
    let ypos = -diagram.path.points[3].y;
    if (embed_image) {
        set_image_href_dataURL(image, diagram.imgdata.src);
    }
    else {
        image.setAttribute("href", diagram.imgdata.src);
    }
    image.setAttribute("width", width.toString());
    image.setAttribute("height", height.toString());
    image.setAttribute("transform", `matrix(${a} ${b} ${c} ${d} ${xpos} ${ypos})`);
    image.setAttribute("preserveAspectRatio", "none");
    if (svgtag != undefined)
        image.setAttribute("_dg_tag", svgtag);
    target_element.appendChild(image);
}
/**
 * Collect all DiagramType.Text in the diagram
 * @param diagram the outer diagram
 * @returns a list of DiagramType.Text
*/
function collect_text(diagram, type) {
    if (diagram.type == type) {
        return [diagram];
    }
    else if (diagram.type == DiagramType.Diagram) {
        let result = [];
        for (let d of diagram.children) {
            result = result.concat(collect_text(d, type));
        }
        return result;
    }
    else {
        return [];
    }
}
/** Calculate the scaling factor for the text based on the reference svg element */
function calculate_text_scale(referencesvgelement, padding) {
    const pad = expand_directional_value(padding !== null && padding !== void 0 ? padding : 0);
    let bbox = referencesvgelement.getBBox();
    let refsvgelement_width = referencesvgelement.width.baseVal.value - pad[1] - pad[3];
    let refsvgelement_height = referencesvgelement.height.baseVal.value - pad[0] - pad[2];
    return Math.max(bbox.width / refsvgelement_width, bbox.height / refsvgelement_height);
}
/**
 * @param svgelement the svg element to draw to
 * @param diagrams the list of text diagrams to draw
 * @param calculated_scale the calculated scale for the text
 */
function draw_texts(target_element, diagrams, calculated_scale, svgtag) {
    for (let diagram of diagrams) {
        let style = Object.assign(Object.assign({}, default_text_diagram_style), diagram.style); // use default if not defined
        style.fill = get_color(style.fill, tab_color);
        style.stroke = get_color(style.stroke, tab_color);
        let textdata = Object.assign(Object.assign({}, default_textdata), diagram.textdata); // use default if not defined
        if (diagram.path == undefined) {
            throw new Error("Text must have a path");
        }
        // draw svg of text
        let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        // text.setAttribute("x", diagram.path.points[0].x.toString());
        // text.setAttribute("y", (-diagram.path.points[0].y).toString());
        let xpos = diagram.path.points[0].x;
        let ypos = -diagram.path.points[0].y;
        let angle_deg = to_degree(parseFloat(textdata["angle"]));
        let scale = textdata["font-scale"] == "auto" ?
            calculated_scale : parseFloat(textdata["font-scale"]);
        let font_size = parseFloat(textdata["font-size"]) * scale;
        // set font styles (font-family, font-size, font-weight)
        text.setAttribute("font-family", textdata["font-family"]);
        text.setAttribute("font-style", textdata["font-style"]);
        text.setAttribute("font-size", font_size.toString());
        text.setAttribute("font-weight", textdata["font-weight"]);
        text.setAttribute("text-anchor", textdata["text-anchor"]);
        text.setAttribute("dy", textdata["dy"]);
        // text.setAttribute("dominant-baseline", textdata["dominant-baseline"] as string);
        text.setAttribute("transform", `translate(${xpos} ${ypos}) rotate(${angle_deg}) `);
        if (svgtag != undefined)
            text.setAttribute("_dg_tag", svgtag);
        // custom attribute for tex display
        text.setAttribute("_x", xpos.toString());
        text.setAttribute("_y", ypos.toString());
        text.setAttribute("_angle", angle_deg.toString());
        for (let stylename in style) {
            text.style[stylename] = style[stylename];
        }
        // set the content of the text
        let text_content = textdata["text"];
        if (diagram.tags.includes(TAG.TEXTVAR) && !is_texstr(text_content))
            text_content = str_to_mathematical_italic(text_content);
        text.innerHTML = text_content;
        // add to svgelement
        target_element.appendChild(text);
    }
}
/**
 * @param svgelement the svg element to draw to
 * @param diagrams the list of text diagrams to draw
 * @param calculated_scale the calculated scale for the text
 */
function draw_multiline_texts(target_element, diagrams, calculated_scale, svgtag) {
    var _a, _b, _c, _d, _e;
    for (let diagram of diagrams) {
        //     let style = {...default_text_diagram_style, ...diagram.style}; // use default if not defined
        //     style.fill = get_color(style.fill as string, tab_color);
        //     style.stroke = get_color(style.stroke as string, tab_color);
        //
        //     let textdata = {...default_textdata, ...diagram.textdata}; // use default if not defined
        if (diagram.path == undefined) {
            throw new Error("Text must have a path");
        }
        // draw svg of text
        let textsvg = document.createElementNS("http://www.w3.org/2000/svg", "text");
        let xpos = diagram.path.points[0].x;
        let ypos = -diagram.path.points[0].y;
        // let angle_deg = to_degree(parseFloat(textdata["angle"] as string));
        let angle_deg = 0;
        // use default if not defined
        let textdata = Object.assign(Object.assign(Object.assign({}, default_textdata), { dy: "0", "text-anchor": "start" }), diagram.textdata);
        let diagram_font_size = textdata["font-size"];
        if (((_a = diagram.multilinedata) === null || _a === void 0 ? void 0 : _a.content) == undefined) {
            throw new Error("MultilineText must have multilinedata");
        }
        // let current_line : number = 0;
        let dg_scale_factor = (_b = diagram.multilinedata["scale-factor"]) !== null && _b !== void 0 ? _b : 1;
        let is_firstline = true;
        let is_in_front = true;
        let newline_dy = "1em";
        for (let tspandata of diagram.multilinedata.content) {
            if (tspandata.text == "\n") {
                is_in_front = true;
                newline_dy = (_c = tspandata.style['dy']) !== null && _c !== void 0 ? _c : "1em";
                continue;
            }
            // create tspan for each tspandata
            let tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
            let not_setting_dy = (tspandata.style['dy'] == undefined);
            let tspanstyle = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, default_text_diagram_style), textdata), { dy: "0", dx: "0" }), { "font-size": diagram_font_size }), tspandata.style);
            if (is_in_front) {
                tspan.setAttribute("x", "0");
                let textdata_dy = (_d = textdata["dy"]) !== null && _d !== void 0 ? _d : "0";
                if (not_setting_dy)
                    tspanstyle.dy = is_firstline ? textdata_dy : newline_dy;
                is_in_front = false;
            }
            let scale = tspanstyle["font-scale"] == "auto" ?
                calculated_scale : parseFloat(tspanstyle["font-scale"]);
            let font_size_scale_factor = (_e = tspanstyle["font-size-scale-factor"]) !== null && _e !== void 0 ? _e : 1;
            let font_size = parseFloat(tspanstyle["font-size"])
                * scale * dg_scale_factor * font_size_scale_factor;
            if (tspanstyle["tag"])
                tspan.setAttribute("_dg_tag", tspanstyle["tag"]);
            tspan.style.whiteSpace = "pre";
            // if we do style.whiteSpace in `textsvg`, it doesnt work in Apple's webkit
            tspan.setAttribute("dx", tspanstyle.dx);
            tspan.setAttribute("dy", tspanstyle.dy);
            tspan.setAttribute("font-style", tspanstyle["font-style"]);
            tspan.setAttribute("font-family", tspanstyle["font-family"]);
            // tspan.setAttribute("font-size", tspanstyle["font-size"] as string);
            tspan.setAttribute("font-size", font_size.toString());
            tspan.setAttribute("font-weight", tspanstyle["font-weight"]);
            // tspan.setAttribute("text-anchor", tspanstyle["text-anchor"] as string);
            tspan.style["fill"] = get_color(tspanstyle.fill, tab_color);
            tspan.style["stroke"] = get_color(tspanstyle.stroke, tab_color);
            tspan.style["opacity"] = tspanstyle.opacity;
            // if baseline-shift is defined, set it
            if (tspanstyle["baseline-shift"])
                tspan.setAttribute("baseline-shift", tspanstyle["baseline-shift"]);
            let text = tspandata.text;
            if (tspanstyle["textvar"])
                text = str_to_mathematical_italic(text);
            tspan.innerHTML = text;
            textsvg.appendChild(tspan);
            is_firstline = false;
        }
        //
        // let scale = textdata["font-scale"] == "auto" ? 
        //     calculated_scale : parseFloat(textdata["font-scale"] as string);
        // let font_size = parseFloat(textdata["font-size"] as string) * scale;
        //
        // // set font styles (font-family, font-size, font-weight)
        // text.setAttribute("font-family", textdata["font-family"] as string);
        // text.setAttribute("font-size", font_size.toString());
        // text.setAttribute("font-weight", textdata["font-weight"] as string);
        // text.setAttribute("text-anchor", textdata["text-anchor"] as string);
        // // text.setAttribute("dominant-baseline", textdata["dominant-baseline"] as string);
        textsvg.setAttribute("dy", textdata["dy"]);
        textsvg.setAttribute("text-anchor", textdata["text-anchor"]);
        textsvg.setAttribute("transform", `translate(${xpos} ${ypos}) rotate(${angle_deg}) `);
        if (svgtag != undefined)
            textsvg.setAttribute("_dg_tag", svgtag);
        //
        // // custom attribute for tex display
        // text.setAttribute("_x", xpos.toString());
        // text.setAttribute("_y", ypos.toString());
        // text.setAttribute("_angle", angle_deg.toString());
        // 
        // for (let stylename in style) {
        //     text.style[stylename as any] = (style as any)[stylename as any];
        // }
        //
        // // set the content of the text
        // let text_content = textdata["text"];
        // if (diagram.tags.includes('textvar') && !is_texstr(text_content)) 
        //     text_content = str_to_mathematical_italic(text_content);
        // text.innerHTML = text_content;
        //
        // // add to svgelement
        target_element.appendChild(textsvg);
    }
}
/**
 * Get all svg elements with a specific tag
 * @param svgelement the svg element to search
 * @param tag the tag to search
 * @returns a list of svg elements with the tag
 */
function get_tagged_svg_element(tag, svgelement) {
    var _a;
    let result = [];
    for (let i in svgelement.children) {
        let child = svgelement.children[i];
        if (!(child instanceof SVGElement))
            continue;
        if (child.getAttribute("_dg_tag") == tag) {
            result.push(child);
        }
        // recurse through all children
        if ((_a = child.children) === null || _a === void 0 ? void 0 : _a.length) {
            result = result.concat(get_tagged_svg_element(tag, child));
        }
    }
    return result;
}
/**
 * @param svgelement the svg element to draw to
 * @param diagram the diagram to draw
 * @param render_text whether to render text
 * @param embed_image (optional) whether to embed images
 * this allow the image to be downloaded as SVG with the image embedded
 * @param text_scaling_factor (optional) the scaling factor for text
 * @param svgtag (optional) the tag to add to the svg element
 */
function f_draw_to_svg(svgelement, target_element, diagram, render_text = true, embed_image = false, text_scaling_factor, svgtag) {
    if (diagram.type == DiagramType.Polygon) {
        draw_polygon(svgelement, target_element, diagram, svgtag);
    }
    else if (diagram.type == DiagramType.Curve) {
        draw_curve(svgelement, target_element, diagram, svgtag);
    }
    else if (diagram.type == DiagramType.Text || diagram.type == DiagramType.MultilineText) ;
    else if (diagram.type == DiagramType.Image) {
        draw_image(target_element, diagram, embed_image, svgtag);
    }
    else if (diagram.type == DiagramType.Diagram) {
        for (let d of diagram.children) {
            f_draw_to_svg(svgelement, target_element, d, false, embed_image, undefined, svgtag);
        }
    }
    else {
        console.warn("Unreachable, unknown diagram type : " + diagram.type);
    }
    // draw text last to make the scaling works
    // because the text is scaled based on the bounding box of the svgelement
    if (render_text) {
        if (text_scaling_factor == undefined) {
            text_scaling_factor = calculate_text_scale(svgelement);
        }
        let text_diagrams = collect_text(diagram, DiagramType.Text);
        let multiline_diagrams = collect_text(diagram, DiagramType.MultilineText);
        draw_texts(target_element, text_diagrams, text_scaling_factor !== null && text_scaling_factor !== void 0 ? text_scaling_factor : 1, svgtag);
        draw_multiline_texts(target_element, multiline_diagrams, text_scaling_factor !== null && text_scaling_factor !== void 0 ? text_scaling_factor : 1, svgtag);
    }
}
/**
 * WARNING: DEPRECATED
 * use `draw_to_svg_element` instead
 *
 * Draw a diagram to an svg element
 * @param outer_svgelement the outer svg element to draw to
 * @param diagram the diagram to draw
 * @param set_html_attribute whether to set the html attribute of the outer_svgelement
 * @param render_text whether to render text
 * @param clear_svg whether to clear the svg before drawing
 */
function draw_to_svg(outer_svgelement, diagram, set_html_attribute = true, render_text = true, clear_svg = true) {
    let options = {
        set_html_attribute: set_html_attribute,
        render_text: render_text,
        clear_svg: clear_svg,
    };
    draw_to_svg_element(outer_svgelement, diagram, options);
}
// TODO: replace draw_to_svg with the current draw_to_svg_element in the next major version
/**
 * Draw a diagram to an svg element
 * @param outer_svgelement the outer svg element to draw to
 * @param diagram the diagram to draw
 * @param options the options for drawing
 * ```typescript
 * options : {
 *    set_html_attribute? : boolean (true),
 *    render_text? : boolean (true),
 *    clear_svg? : boolean (true),
 *    embed_image? : boolean (false),
 *    background_color? : string (undefined),
 *    padding? : number | number[] (10),
 *    text_scaling_reference_svg? : SVGSVGElement (undefined),
 *    text_scaling_reference_padding? : number | number[] (undefined),
 * }
 * ````
 * define `text_scaling_reference_svg` and `text_scaling_reference_padding` to scale text based on another svg element
 */
function draw_to_svg_element(outer_svgelement, diagram, options = {}) {
    var _a, _b, _c, _d, _e, _f, _g;
    const set_html_attribute = (_a = options.set_html_attribute) !== null && _a !== void 0 ? _a : true;
    const render_text = (_b = options.render_text) !== null && _b !== void 0 ? _b : true;
    const clear_svg = (_c = options.clear_svg) !== null && _c !== void 0 ? _c : true;
    const embed_image = (_d = options.embed_image) !== null && _d !== void 0 ? _d : false;
    let svgelement = undefined;
    // check if outer_svgelement has a child with meta=diagram_svg
    for (let i in outer_svgelement.children) {
        let child = outer_svgelement.children[i];
        if (child instanceof SVGSVGElement && child.getAttribute("meta") == "diagram_svg") {
            svgelement = child;
            break;
        }
    }
    if (svgelement == undefined) {
        // if svgelemet doesn't exist yet, create it
        // create an inner svg element
        svgelement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgelement.setAttribute("meta", "diagram_svg");
        svgelement.setAttribute("width", "100%");
        svgelement.setAttribute("height", "100%");
        outer_svgelement.appendChild(svgelement);
    }
    handle_filter_strings(outer_svgelement, options.filter_strings);
    let text_scaling_factor = undefined;
    if (options.text_scaling_reference_svg) {
        options.text_scaling_reference_padding = (_f = (_e = options.text_scaling_reference_padding) !== null && _e !== void 0 ? _e : options.padding) !== null && _f !== void 0 ? _f : 10;
        options.text_scaling_reference_padding = expand_directional_value(options.text_scaling_reference_padding);
        text_scaling_factor = calculate_text_scale(options.text_scaling_reference_svg, options.text_scaling_reference_padding);
    }
    // TODO : for performance, do smart clearing of svg, and not just clear everything
    if (clear_svg)
        svgelement.innerHTML = "";
    f_draw_to_svg(svgelement, svgelement, diagram, render_text, embed_image, text_scaling_factor);
    if (set_html_attribute) {
        const pad_px = expand_directional_value((_g = options.padding) !== null && _g !== void 0 ? _g : 10);
        // set viewbox to the bounding box
        let bbox = svgelement.getBBox();
        // add padding of 10px to the bounding box (if the graph is small, it'll mess it up)
        // scale 10px based on the width and height of the svg
        let svg_width = svgelement.width.baseVal.value - pad_px[1] - pad_px[3];
        let svg_height = svgelement.height.baseVal.value - pad_px[0] - pad_px[2];
        let scale = Math.max(bbox.width / svg_width, bbox.height / svg_height);
        let pad = pad_px.map(p => p * scale);
        // [top, right, bottom, left]
        bbox.x -= pad[3];
        bbox.y -= pad[0];
        bbox.width += pad[1] + pad[3];
        bbox.height += pad[0] + pad[2];
        svgelement.setAttribute("viewBox", `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
        // set preserveAspectRatio to xMidYMid meet
        svgelement.setAttribute("preserveAspectRatio", "xMidYMid meet");
        outer_svgelement.style.overflow = "visible";
    }
    if (options.background_color) {
        let bbox = svgelement.getBBox();
        // if svgelement has viewBox set, use it instead of getBBox
        if (svgelement.viewBox.baseVal.width !== 0)
            bbox = svgelement.viewBox.baseVal;
        // draw a rectangle as the background
        let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", bbox.x.toString());
        rect.setAttribute("y", bbox.y.toString());
        rect.setAttribute("width", bbox.width.toString());
        rect.setAttribute("height", bbox.height.toString());
        rect.style.fill = get_color(options.background_color, tab_color);
        rect.style.stroke = "none";
        // prepend
        svgelement.insertBefore(rect, svgelement.firstChild);
    }
}
function handle_filter_strings(svgelement, filter_strings) {
    if (filter_strings == undefined || filter_strings.length == 0)
        return;
    let defs = svgelement.querySelector("defs");
    if (defs == null) {
        defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        svgelement.insertBefore(defs, svgelement.firstChild);
    }
    defs.innerHTML = "";
    for (let filter_string of filter_strings) {
        defs.innerHTML += filter_string;
    }
}
function is_texstr(s) {
    return s.startsWith("$") && s.endsWith("$");
}
function is_texdisplaystr(s) {
    return s.startsWith("$$") && s.endsWith("$$");
}
function strip_texstr(s) {
    if (is_texdisplaystr(s))
        return s.substring(2, s.length - 2);
    if (is_texstr(s))
        return s.substring(1, s.length - 1);
    return s;
}
/**
 * Recursively handle tex in svg
 * @param svg the svg element to handle
 * @param texhandler the tex handler function
 */
function handle_tex_in_svg(svg, texhandler) {
    // recurse through all children of svg until we find text
    // then replace the text with the svg returned by texhandler
    for (let i = 0; i < svg.children.length; i++) {
        let child = svg.children[i];
        if (child instanceof SVGTextElement) {
            let str = child.innerHTML;
            if (!is_texstr(str))
                continue;
            let fontsizestr = child.getAttribute('font-size');
            if (fontsizestr == null)
                continue;
            let fontsize = parseFloat(fontsizestr);
            let svgstr = texhandler(strip_texstr(str), {
                display: is_texdisplaystr(str),
                // fontsize : parseFloat(fontsize),
            });
            let xstr = child.getAttribute('_x');
            let ystr = child.getAttribute('_y');
            // let angstr = child.getAttribute('_angle');
            if (xstr == null || ystr == null)
                continue;
            let textanchor = child.getAttribute('text-anchor');
            let dy = child.getAttribute('dy');
            if (textanchor == null || dy == null)
                continue;
            child.outerHTML = svgstr;
            child = svg.children[i]; // update child
            // HACK: scaling for mathjax tex2svg, for other option think about it later
            let widthexstr = child.getAttribute('width'); // ###ex
            if (widthexstr == null)
                continue;
            let widthex = parseFloat(widthexstr.substring(0, widthexstr.length - 2));
            let heightexstr = child.getAttribute('height'); // ###ex
            if (heightexstr == null)
                continue;
            let heightex = parseFloat(heightexstr.substring(0, heightexstr.length - 2));
            const magic_number = 2;
            let width = widthex * fontsize / magic_number;
            let height = heightex * fontsize / magic_number;
            let xval = parseFloat(xstr);
            let yval = parseFloat(ystr);
            switch (textanchor) {
                case "start": break; // left
                case "middle": // center
                    xval -= width / 2;
                    break;
                case "end": // right
                    xval -= width;
                    break;
            }
            switch (dy) {
                case "0.75em": break; // top
                case "0.25em": // center
                    yval -= height / 2;
                    break;
                case "-0.25em": // bottom
                    yval -= height;
                    break;
            }
            child.setAttribute('width', width.toString());
            child.setAttribute('height', height.toString());
            child.setAttribute('x', xval.toString());
            child.setAttribute('y', yval.toString());
        }
        else if (child instanceof SVGElement) {
            handle_tex_in_svg(child, texhandler);
        }
    }
}
/**
 * Download the svg as svg file
 * @param outer_svgelement the outer svg element to download
 */
function download_svg_as_svg(outer_svgelement) {
    let inner_svgelement = outer_svgelement.querySelector("svg[meta=diagram_svg]");
    if (inner_svgelement == null) {
        console.warn("Cannot find svg element");
        return;
    }
    let locator_svgelement = outer_svgelement.querySelector("svg[meta=control_svg]");
    let svgelement = inner_svgelement;
    // concat locator_svgelement to the copy of inner_svgelement
    if (locator_svgelement != null) {
        let copy_inner_svgelement = inner_svgelement.cloneNode(true);
        for (let i in locator_svgelement.children) {
            let child = locator_svgelement.children[i];
            if (!(child instanceof SVGSVGElement))
                continue;
            copy_inner_svgelement.appendChild(child.cloneNode(true));
        }
        svgelement = copy_inner_svgelement;
    }
    // get svg string
    let svg_string = new XMLSerializer().serializeToString(svgelement);
    let blob = new Blob([svg_string], { type: "image/svg+xml" });
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = "diagramatics.svg";
    a.click();
}
/**
 * Download the svg as png file
 * @param outer_svgelement the outer svg element to download
 */
function download_svg_as_png(outer_svgelement) {
    let inner_svgelement = outer_svgelement.querySelector("svg[meta=diagram_svg]");
    if (inner_svgelement == null) {
        console.warn("Cannot find svg element");
        return;
    }
    let svgelem = outer_svgelement;
    let svg_string = new XMLSerializer().serializeToString(svgelem);
    let svg_blob = new Blob([svg_string], { type: "image/svg+xml" });
    const DOMURL = window.URL || window.webkitURL || window;
    const url = DOMURL.createObjectURL(svg_blob);
    const image = new Image();
    image.width = svgelem.width.baseVal.value;
    image.height = svgelem.height.baseVal.value;
    image.src = url;
    image.onload = function () {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(image, 0, 0);
        DOMURL.revokeObjectURL(url);
        const imgURI = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        const a = document.createElement("a");
        a.href = imgURI;
        a.download = "diagramatics.png";
        a.click();
    };
}

// function helpers to create common shapes
/**
 * Create rectange centered at origin
 * @param width width of the rectangle
 * @param height height of the rectangle
 * @returns a Diagram object
 */
function rectangle(width, height) {
    let points = [
        V2(-width / 2, -height / 2), V2(width / 2, -height / 2),
        V2(width / 2, height / 2), V2(-width / 2, height / 2)
    ];
    return polygon(points);
}
/**
 * Create rectange with a given bottom left corner and top right corner
 * @param bottomleft bottom left corner of the rectangle
 * @param topright top right corner of the rectangle
 * @returns a Diagram object
 */
function rectangle_corner(bottomleft, topright) {
    let points = [
        bottomleft, V2(topright.x, bottomleft.y),
        topright, V2(bottomleft.x, topright.y),
    ];
    return polygon(points);
}
/**
 * Create square centered at origin
 * @param side side length of the square
 * @returns a Diagram object
 */
function square(side = 1) {
    return rectangle(side, side);
}
/**
 * Create regular polygon centered at origin with a given radius
 * @param n number of sides
 * @param radius radius of the polygon
 * @returns a Diagram object
 * \* if you want to create a regular polygon with a given side length, use regular_polygon_side
 */
function regular_polygon(n, radius = 1) {
    let points = [];
    for (let i = 0; i < n; i++) {
        points.push(V2(0, radius).rotate(i * 2 * Math.PI / n));
    }
    return polygon(points);
}
/**
 * Create regular polygon centered at origin with a given side length
 * @param n number of sides
 * @param sidelength side length of the polygon
 * @returns a Diagram object
 * \* if you want to create a regular polygon with a given radius, use regular_polygon
 */
function regular_polygon_side(n, sidelength = 1) {
    let radius = sidelength / (2 * Math.sin(Math.PI / n));
    return regular_polygon(n, radius);
}
/**
 * Create circle centered at origin
 * *currently implemented as a regular polygon with 50 sides*
 * @param radius radius of the circle
 * @returns a Diagram object
 */
function circle(radius = 1) {
    return regular_polygon(50, radius).append_tags(TAG.CIRCLE);
}
/**
 * Create an arc centered at origin
 * @param radius radius of the arc
 * @param angle angle of the arc
 * @returns a Diagram object
 */
function arc(radius = 1, angle = to_radian(360)) {
    let n = 100;
    let points = [];
    for (let i = 0; i < n; i++) {
        points.push(V2(radius, 0).rotate(i * angle / (n - 1)));
    }
    return curve(points);
}
/**
 * Create an arrow from origin to a given point
 * @param v the end point of the arrow
 * @param headsize size of the arrow head
 * @returns a Diagram object
 */
function arrow(v, headsize = 1) {
    let line_diagram = line$1(V2(0, 0), v).append_tags(TAG.ARROW_LINE);
    let raw_triangle = polygon([V2(0, 0), V2(-headsize, headsize / 2), V2(-headsize, -headsize / 2)]);
    let head_triangle = raw_triangle.rotate(v.angle()).position(v).append_tags(TAG.ARROW_HEAD);
    return diagram_combine(line_diagram, head_triangle);
}
/**
 * Create an arrow from a given point to another given point
 * @param start the start point of the arrow
 * @param end the end point of the arrow
 * @param headsize size of the arrow head
 * @returns a Diagram object
 */
function arrow1(start, end, headsize = 1) {
    return arrow(end.sub(start), headsize).position(start);
}
/**
 * Create a two-sided arrow from a given point to another given point
 * @param start the start point of the arrow
 * @param end the end point of the arrow
 * @param headsize size of the arrow head
 * @returns a Diagram object
 */
function arrow2$1(start, end, headsize = 1) {
    let line_diagram = line$1(start, end).append_tags(TAG.ARROW_LINE);
    let direction = end.sub(start);
    let raw_triangle = polygon([V2(0, 0), V2(-headsize, headsize / 2), V2(-headsize, -headsize / 2)]);
    let head_triangle = raw_triangle.rotate(direction.angle()).position(end).append_tags(TAG.ARROW_HEAD);
    let head_triangle2 = raw_triangle.rotate(direction.angle() + Math.PI).position(start).append_tags(TAG.ARROW_HEAD);
    return diagram_combine(line_diagram, head_triangle, head_triangle2);
}
/**
 * Create a text object with mathematical italic font
 * @param str text to be displayed
 * @returns a Diagram object
 */
function textvar(str) {
    return text(str).append_tags(TAG.TEXTVAR);
}

// ============================= utilities
/**
 * Calculate the area of a polygon
 * @param p a polygon Diagram
 * if p is a Diagram with children, calculate the sum of the areas of the children
 * @returns area of the polygon
*/
function area(p) {
    var _a, _b;
    if (p.type == DiagramType.Polygon) {
        return calculate_polygon_area((_b = (_a = p.path) === null || _a === void 0 ? void 0 : _a.points) !== null && _b !== void 0 ? _b : []);
    }
    else if (p.type == DiagramType.Diagram) {
        return p.children.reduce((acc, c) => acc + area(c), 0);
    }
    else {
        return 0;
    }
}
function calculate_polygon_area(vertices) {
    let area = 0;
    const n = vertices.length;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const xi = vertices[i].x;
        const yi = vertices[i].y;
        const xj = vertices[j].x;
        const yj = vertices[j].y;
        area += xi * yj - xj * yi;
    }
    return Math.abs(area) / 2;
}
/**
 * Get the radius of a circle
 * @param circle a circle Diagram
 * @returns radius of the circle
 */
function circle_radius(circle) {
    let tags = circle.tags;
    if (!tags.includes(TAG.CIRCLE))
        return -1;
    let center = circle.get_anchor('center-center');
    if (circle.path == undefined)
        return -1;
    let p0 = circle.path.points[0];
    return center.sub(p0).length();
}
/**
 * Get the tangent points of a circle from a point
 * @param point a point
 * @param circle a circle Diagram
 */
function circle_tangent_point_from_point(point, circle) {
    let radius = circle_radius(circle);
    if (radius == -1)
        return [V2(0, 0), V2(0, 0)];
    let center = circle.get_anchor('center-center');
    // https://en.wikipedia.org/wiki/Tangent_lines_to_circles
    let r = radius;
    let d0_2 = center.sub(point).length_sq();
    let r_2 = r * r;
    let v0 = point.sub(center);
    let sLeft = r_2 / d0_2;
    let vLeft = v0.scale(sLeft);
    let sRight = r * Math.sqrt(d0_2 - r_2) / d0_2;
    let vRight = V2(-v0.y, v0.x).scale(sRight);
    let P1 = vLeft.add(vRight).add(center);
    let P2 = vLeft.sub(vRight).add(center);
    return [P1, P2];
}
/**
 * Get the points of a line
 * @param l a line Diagram
 * @returns the two points of the line
 */
function line_points(l) {
    let tags = l.tags;
    if (!tags.includes(TAG.LINE))
        return [V2(0, 0), V2(0, 0)];
    if (l.path == undefined)
        return [V2(0, 0), V2(0, 0)];
    let p0 = l.path.points[0];
    let p1 = l.path.points[1];
    return [p0, p1];
}
/**
 * Get the intersection of a line with a horizontal line at y = yi
 * @param l a line Diagram
 * @param yi y value of the horizontal line
 * @returns the intersection point
 */
function line_intersection_y(l, yi) {
    let [a, b] = line_points(l);
    let xi = a.x + (b.x - a.x) * (yi - a.y) / (b.y - a.y);
    return V2(xi, yi);
}
/**
 * Get the intersection of a line with a vertical line at x = xi
 * @param l a line Diagram
 * @param xi x value of the vertical line
 * @returns the intersection point
 */
function line_intersection_x(l, xi) {
    let [a, b] = line_points(l);
    let yi = a.y + (b.y - a.y) * (xi - a.x) / (b.x - a.x);
    return V2(xi, yi);
}
/**
 * Get the intersection of two lines
 * @param l1 a line Diagram
 * @param l2 a line Diagram
 * @returns the intersection point
 * if the lines are parallel, return V2(Infinity, Infinity)
 */
function line_intersection$1(l1, l2) {
    if (!l1.tags.includes(TAG.LINE) || !l2.tags.includes(TAG.LINE))
        return V2(Infinity, Infinity);
    let [a1, b1] = line_points(l1);
    let [a2, b2] = line_points(l2);
    let x1 = a1.x;
    let y1 = a1.y;
    let x2 = b1.x;
    let y2 = b1.y;
    let x3 = a2.x;
    let y3 = a2.y;
    let x4 = b2.x;
    let y4 = b2.y;
    let d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (d == 0)
        return V2(Infinity, Infinity);
    let x = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / d;
    let y = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / d;
    return V2(x, y);
}
// ============================= shapes
/**
 * Extend a line by a length on both ends
 * @param l a line Diagram
 * @param len1 length to extend on the first end
 * @param len2 length to extend on the second end
 * @returns a new line Diagram
 */
function line_extend(l, len1, len2) {
    let tags = l.tags;
    if (!tags.includes(TAG.LINE))
        return l;
    if (l.path == undefined)
        return l;
    let p0 = l.path.points[0];
    let p1 = l.path.points[1];
    let v = p1.sub(p0).normalize();
    let p0_new = p0.sub(v.scale(len1));
    let p1_new = p1.add(v.scale(len2));
    let newl = l.copy();
    if (newl.path == undefined)
        return l; // to surpress typescript error
    newl.path.points = [p0_new, p1_new];
    return newl;
}
/**
 * Get the size of a diagram
 * @param diagram a diagram
 * @returns the width and height of the diagram
 */
function size(diagram) {
    let bb = diagram.bounding_box();
    return [bb[1].x - bb[0].x, bb[1].y - bb[0].y];
}

var shapes_geometry = /*#__PURE__*/Object.freeze({
    __proto__: null,
    area: area,
    circle_radius: circle_radius,
    circle_tangent_point_from_point: circle_tangent_point_from_point,
    line_extend: line_extend,
    line_intersection: line_intersection$1,
    line_intersection_x: line_intersection_x,
    line_intersection_y: line_intersection_y,
    line_points: line_points,
    size: size
});

/**
 * Align diagrams vertically
 * @param diagrams diagrams to be aligned
 * @param alignment vertical alignment of the diagrams
 * alignment can be 'top', 'center', or 'bottom'
 * @returns array of aligned diagrams
 */
function align_vertical(diagrams, alignment = 'center') {
    // align all the diagrams following the first diagram
    if (diagrams.length == 0) {
        return empty();
    }
    let newdiagrams = [...diagrams];
    if (alignment == 'top') {
        let top_y = newdiagrams[0].get_anchor("top-left").y;
        // return diagrams.map(d => d.translate(V2(0, top_y - d.get_anchor("top-left").y)));
        for (let i = 0; i < newdiagrams.length; i++) {
            newdiagrams[i] = newdiagrams[i].translate(V2(0, top_y - newdiagrams[i].get_anchor("top-left").y));
        }
        return diagram_combine(...newdiagrams);
    }
    else if (alignment == 'center') {
        let center_y = newdiagrams[0].get_anchor("center-left").y;
        // return diagrams.map(d => d.translate(V2(0, center_y - d.get_anchor("center-left").y)));
        for (let i = 0; i < newdiagrams.length; i++) {
            newdiagrams[i] = newdiagrams[i].translate(V2(0, center_y - newdiagrams[i].get_anchor("center-left").y));
        }
        return diagram_combine(...newdiagrams);
    }
    else if (alignment == 'bottom') {
        let bottom_y = newdiagrams[0].get_anchor("bottom-left").y;
        // return diagrams.map(d => d.translate(V2(0, bottom_y - d.get_anchor("bottom-left").y)));
        for (let i = 0; i < newdiagrams.length; i++) {
            newdiagrams[i] = newdiagrams[i].translate(V2(0, bottom_y - newdiagrams[i].get_anchor("bottom-left").y));
        }
        return diagram_combine(...newdiagrams);
    }
    else {
        throw new Error("Unknown vertical alignment : " + alignment);
    }
}
/**
 * Align diagrams horizontally
 * @param diagrams diagrams to be aligned
 * @param alignment horizontal alignment of the diagrams
 * alignment can be 'left', 'center', or 'right'
 * @returns array of aligned diagrams
 */
function align_horizontal(diagrams, alignment = 'center') {
    // align all the diagrams following the first diagram
    if (diagrams.length == 0) {
        return empty();
    }
    let newdiagrams = [...diagrams];
    if (alignment == 'left') {
        let left_x = newdiagrams[0].get_anchor("top-left").x;
        // return newdiagrams.map(d => d.translate(V2(left_x - d.get_anchor("top-left").x, 0)));
        for (let i = 0; i < newdiagrams.length; i++) {
            newdiagrams[i] = newdiagrams[i].translate(V2(left_x - newdiagrams[i].get_anchor("top-left").x, 0));
        }
        return diagram_combine(...newdiagrams);
    }
    else if (alignment == 'center') {
        let center_x = newdiagrams[0].get_anchor("top-center").x;
        // return newdiagrams.map(d => d.translate(V2(center_x - d.get_anchor("top-center").x, 0)));
        for (let i = 0; i < newdiagrams.length; i++) {
            newdiagrams[i] = newdiagrams[i].translate(V2(center_x - newdiagrams[i].get_anchor("top-center").x, 0));
        }
        return diagram_combine(...newdiagrams);
    }
    else if (alignment == 'right') {
        let right_x = newdiagrams[0].get_anchor("top-right").x;
        // return newdiagrams.map(d => d.translate(V2(right_x - d.get_anchor("top-right").x, 0)));
        for (let i = 0; i < newdiagrams.length; i++) {
            newdiagrams[i] = newdiagrams[i].translate(V2(right_x - newdiagrams[i].get_anchor("top-right").x, 0));
        }
        return diagram_combine(...newdiagrams);
    }
    else {
        throw new Error("Unknown horizontal alignment : " + alignment);
    }
}
/**
 * Distribute diagrams horizontally
 * @param diagrams diagrams to be distributed
 * @param space space between the diagrams (default = 0)
 * @returns array of distributed diagrams
 */
function distribute_horizontal(diagrams, space = 0) {
    if (diagrams.length == 0) {
        return empty();
    }
    let newdiagrams = [...diagrams];
    let distributed_diagrams = [newdiagrams[0]];
    for (let i = 1; i < newdiagrams.length; i++) {
        let prev_diagram = distributed_diagrams[i - 1];
        let this_diagram = newdiagrams[i];
        let prev_right = prev_diagram.get_anchor("top-right").x;
        let this_left = this_diagram.get_anchor("top-left").x;
        let dx = prev_right - this_left + space;
        distributed_diagrams.push(this_diagram.translate(V2(dx, 0)));
    }
    return diagram_combine(...distributed_diagrams);
}
/**
 * Distribute diagrams vertically
 * @param diagrams diagrams to be distributed
 * @param space space between the diagrams (default = 0)
 * @returns array of distributed diagrams
 */
function distribute_vertical(diagrams, space = 0) {
    if (diagrams.length == 0) {
        return empty();
    }
    let newdiagrams = [...diagrams];
    let distributed_diagrams = [newdiagrams[0]];
    for (let i = 1; i < newdiagrams.length; i++) {
        let prev_diagram = distributed_diagrams[i - 1];
        let this_diagram = newdiagrams[i];
        let prev_bottom = prev_diagram.get_anchor("bottom-left").y;
        let this_top = this_diagram.get_anchor("top-left").y;
        let dy = prev_bottom - this_top - space;
        distributed_diagrams.push(this_diagram.translate(V2(0, dy)));
    }
    return diagram_combine(...distributed_diagrams);
}
/**
 * Distribute diagrams horizontally and align
 * @param diagrams diagrams to be distributed
 * @param horizontal_space space between the diagrams (default = 0)
 * @param alignment vertical alignment of the diagrams
 * alignment can be 'top', 'center', or 'bottom'
 * @returns array of distributed and aligned diagrams
 */
function distribute_horizontal_and_align(diagrams, horizontal_space = 0, alignment = 'center') {
    return distribute_horizontal(align_vertical(diagrams, alignment).children, horizontal_space);
}
/**
 * Distribute diagrams vertically and align
 * @param diagrams diagrams to be distributed
 * @param vertical_space space between the diagrams (default = 0)
 * @param alignment horizontal alignment of the diagrams
 * alignment can be 'left', 'center', or 'right'
 * @returns array of distributed and aligned diagrams
 */
function distribute_vertical_and_align(diagrams, vertical_space = 0, alignment = 'center') {
    return distribute_vertical(align_horizontal(diagrams, alignment).children, vertical_space);
}
/**
 * Distribute diagrams in a grid
 * @param diagrams diagrams to be distributed
 * @param column_count number of columns
 * @param vectical_space space between the diagrams vertically (default = 0)
 * @param horizontal_space space between the diagrams horizontally (default = 0)
 * NODE: the behaviour is updated in v1.3.0
 * (now the returned diagram's children is the distributed diagrams instead of list of list of diagrams)
 */
function distribute_grid_row(diagrams, column_count, vectical_space = 0, horizontal_space = 0) {
    if (diagrams.length == 0) {
        return empty();
    }
    let newdiagrams = [...diagrams];
    let row_count = Math.ceil(newdiagrams.length / column_count);
    let rows = [];
    for (let i = 0; i < row_count; i++) {
        rows.push(newdiagrams.slice(i * column_count, (i + 1) * column_count));
    }
    let distributed_rows = rows.map(row => distribute_horizontal(row, horizontal_space));
    let distributed_diagrams = distribute_vertical(distributed_rows, vectical_space);
    let grid_diagrams = [];
    for (let i = 0; i < distributed_diagrams.children.length; i++) {
        for (let j = 0; j < distributed_diagrams.children[i].children.length; j++) {
            grid_diagrams.push(distributed_diagrams.children[i].children[j]);
        }
    }
    return diagram_combine(...grid_diagrams);
}
/**
 * Distribute diagrams in a variable width row
 * if there is a diagram that is wider than the container width, it will be placed in a separate row
 * @param diagrams diagrams to be distributed
 * @param container_width width of the container
 * @param vertical_space space between the diagrams vertically (default = 0)
 * @param horizontal_space space between the diagrams horizontally (default = 0)
 * @param vertical_alignment vertical alignment of the diagrams (default = 'center')
 * alignment can be 'top', 'center', or 'bottom'
 * @param horizontal_alignment horizontal alignment of the diagrams (default = 'left')
 * alignment can be 'left', 'center', or 'right'
 */
function distribute_variable_row(diagrams, container_width, vertical_space = 0, horizontal_space = 0, vertical_alignment = 'center', horizontal_alignment = 'left') {
    if (diagrams.length == 0) {
        return empty();
    }
    let rows = [];
    let current_row = [];
    let current_row_w = 0;
    function add_diagrams_to_rows(arr) {
        let distributed_row_dg = distribute_horizontal_and_align(arr, horizontal_space, vertical_alignment);
        rows.push(distributed_row_dg);
        current_row = [];
        current_row_w = 0;
    }
    for (let i = 0; i < diagrams.length; i++) {
        let d = diagrams[i];
        let w = size(d)[0];
        if (w > container_width) {
            if (current_row.length > 0)
                add_diagrams_to_rows(current_row);
            current_row.push(d);
            add_diagrams_to_rows(current_row);
            continue;
        }
        if (current_row_w + horizontal_space + w > container_width)
            add_diagrams_to_rows(current_row);
        current_row.push(d);
        current_row_w += w + horizontal_space;
    }
    if (current_row.length > 0)
        add_diagrams_to_rows(current_row);
    // distribute vertically
    let distributed_diagrams = distribute_vertical_and_align(rows, vertical_space, horizontal_alignment);
    let row_diagrams = [];
    for (let i = 0; i < distributed_diagrams.children.length; i++) {
        for (let j = 0; j < distributed_diagrams.children[i].children.length; j++) {
            row_diagrams.push(distributed_diagrams.children[i].children[j]);
        }
    }
    return diagram_combine(...row_diagrams);
}

const FOCUS_RECT_CLASSNAME = "diagramatics-focusrect";
const FOCUS_NO_OUTLINE_CLASSNAME = "diagramatics-focusable-no-outline";
function format_number(val, prec) {
    let fixed = val.toFixed(prec);
    // remove trailing zeros
    // and if the last character is a dot, remove it
    return fixed.replace(/\.?0+$/, "");
}
const defaultFormat_f = (name, val, prec) => {
    let val_str = (typeof val == 'number' && prec != undefined) ? format_number(val, prec) : val.toString();
    return `${str_to_mathematical_italic(name)} = ${val_str}`;
};
var control_svg_name;
(function (control_svg_name) {
    control_svg_name["locator"] = "control_svg";
    control_svg_name["dnd"] = "dnd_svg";
    control_svg_name["custom"] = "custom_int_svg";
    control_svg_name["button"] = "button_svg";
})(control_svg_name || (control_svg_name = {}));
var HTML_INT_TARGET;
(function (HTML_INT_TARGET) {
    HTML_INT_TARGET["DOCUMENT"] = "document";
    HTML_INT_TARGET["SVG"] = "svg";
})(HTML_INT_TARGET || (HTML_INT_TARGET = {}));
/**
 * Object that controls the interactivity of the diagram
 */
class Interactive {
    /**
     * @param control_container_div the div that contains the control elements
     * @param diagram_outer_svg the svg element that contains the diagram
     * \* _only needed if you want to use the locator_
     * @param inp_object_ the object that contains the variables
     * \* _only needed if you want to use custom input object_
     */
    constructor(control_container_div, diagram_outer_svg, inp_object_, event_target = HTML_INT_TARGET.SVG) {
        this.control_container_div = control_container_div;
        this.diagram_outer_svg = diagram_outer_svg;
        this.event_target = event_target;
        this.inp_variables = {};
        this.inp_setter = {};
        this.display_mode = "svg";
        this.diagram_svg = undefined;
        this.locator_svg = undefined;
        this.dnd_svg = undefined;
        this.custom_svg = undefined;
        this.button_svg = undefined;
        this.locatorHandler = undefined;
        this.dragAndDropHandler = undefined;
        this.buttonHandler = undefined;
        // no support for canvas yet
        this.focus_padding = 1;
        this.draw_function = (_) => { };
        this.display_precision = 5;
        this.intervals = {};
        this.registeredEventListenerRemoveFunctions = [];
        this.single_int_mode = false;
        if (inp_object_ != undefined) {
            this.inp_variables = inp_object_;
        }
    }
    draw() {
        var _a, _b;
        this.draw_function(this.inp_variables, this.inp_setter);
        (_a = this.locatorHandler) === null || _a === void 0 ? void 0 : _a.setViewBox();
        (_b = this.dragAndDropHandler) === null || _b === void 0 ? void 0 : _b.setViewBox();
        set_viewbox(this.custom_svg, this.diagram_svg);
        set_viewbox(this.button_svg, this.diagram_svg);
        // TODO: also do this for the other control_svg
    }
    set(variable_name, val) {
        this.inp_setter[variable_name](val);
    }
    get(variable_name) {
        return this.inp_variables[variable_name];
    }
    label(variable_name, value, color = 'white', markType = 'square', markColor = '#8B5CF6', display_format_func = defaultFormat_f) {
        let containerDiv = document.createElement('div');
        containerDiv.classList.add("diagramatics-label-container");
        containerDiv.style.display = 'flex';
        containerDiv.style.alignItems = 'center';
        containerDiv.style.gap = '8px';
        let markDiv = document.createElement('div');
        markDiv.classList.add("diagramatics-label-mark");
        markDiv.style.width = '12px';
        markDiv.style.height = '12px';
        markDiv.style.backgroundColor = markColor;
        if (markType === 'circle') {
            markDiv.style.borderRadius = '50%';
        }
        let labeldiv = document.createElement('div');
        labeldiv.classList.add("diagramatics-label");
        labeldiv.innerHTML = display_format_func(variable_name, value, this.display_precision);
        labeldiv.style.color = color;
        containerDiv.appendChild(markDiv);
        containerDiv.appendChild(labeldiv);
        this.inp_variables[variable_name] = value;
        // setter ==========================
        const setter = (val) => {
            this.inp_variables[variable_name] = val;
            labeldiv.innerHTML = display_format_func(variable_name, val, this.display_precision);
        };
        this.inp_setter[variable_name] = setter;
        // ==============================
        // add components to div
        //
        // <div class="diagramatics-label-container">
        //     <div class="diagramatics-label"></div>
        // </div>
        let container = document.createElement('div');
        container.classList.add("diagramatics-label-container");
        container.appendChild(containerDiv);
        this.control_container_div.appendChild(container);
    }
    /**
     * WARNING: deprecated
     * use `locator_initial_draw` instead
     */
    locator_draw() {
        var _a;
        (_a = this.locatorHandler) === null || _a === void 0 ? void 0 : _a.setViewBox();
    }
    locator_initial_draw() {
        var _a;
        // TODO: generate the svg here
        (_a = this.locatorHandler) === null || _a === void 0 ? void 0 : _a.setViewBox();
    }
    /**
     * alias for `dnd_initial_draw`
     */
    drag_and_drop_initial_draw() {
        this.dnd_initial_draw();
    }
    dnd_initial_draw() {
        var _a, _b;
        (_a = this.dragAndDropHandler) === null || _a === void 0 ? void 0 : _a.setViewBox();
        (_b = this.dragAndDropHandler) === null || _b === void 0 ? void 0 : _b.drawSvg();
    }
    registerEventListener(element, type, callback, options) {
        element.addEventListener(type, callback, options);
        const removeFunction = () => element.removeEventListener(type, callback);
        this.registeredEventListenerRemoveFunctions.push(removeFunction);
    }
    removeRegisteredEventListener() {
        this.registeredEventListenerRemoveFunctions.forEach(f => f());
        this.registeredEventListenerRemoveFunctions = [];
    }
    get_svg_element(metaname, force_recreate = false) {
        var _a;
        if (this.diagram_outer_svg == undefined)
            throw Error("diagram_outer_svg in Interactive class is undefined");
        // check if this.diagram_outer_svg has a child with meta=control_svg
        // if not, create one
        let svg_element = undefined;
        for (let i in this.diagram_outer_svg.children) {
            let child = this.diagram_outer_svg.children[i];
            if (child instanceof SVGSVGElement && child.getAttribute("meta") == metaname) {
                svg_element = child;
            }
        }
        if (this.single_int_mode && force_recreate && svg_element != undefined) {
            (_a = svg_element.remove) === null || _a === void 0 ? void 0 : _a.call(svg_element);
            svg_element = undefined;
        }
        if (svg_element == undefined) {
            svg_element = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg_element.setAttribute("meta", metaname);
            svg_element.setAttribute("width", "100%");
            svg_element.setAttribute("height", "100%");
            if (this.isTargetingDocument())
                svg_element.style.overflow = "visible";
            this.diagram_outer_svg.appendChild(svg_element);
        }
        return svg_element;
    }
    get_diagram_svg() {
        let diagram_svg = this.get_svg_element("diagram_svg");
        this.diagram_svg = diagram_svg;
        return diagram_svg;
    }
    isTargetingDocument() {
        return this.event_target == HTML_INT_TARGET.DOCUMENT;
    }
    set_focus_padding(padding) {
        this.focus_padding = padding;
        if (this.dragAndDropHandler) {
            this.dragAndDropHandler.focus_padding = padding;
        }
        if (this.buttonHandler) {
            this.buttonHandler.focus_padding = padding;
        }
    }
    /**
     * Create a locator
     * Locator is a draggable object that contain 2D coordinate information
     * @param variable_name name of the variable
     * @param value initial value
     * @param radius radius of the locator draggable object
     * @param color color of the locator
     * @param track_diagram if provided, the locator will snap to the closest point on the diagram
     */
    locator(variable_name, value, radius, color = 'blue', track_diagram, blink = true, callback) {
        if (this.diagram_outer_svg == undefined)
            throw Error("diagram_outer_svg in Interactive class is undefined");
        this.inp_variables[variable_name] = value;
        let diagram_svg = this.get_diagram_svg();
        let control_svg = this.get_svg_element(control_svg_name.locator, !this.locator_svg);
        this.locator_svg = control_svg;
        // if this is the fist time this function is called, create a locatorHandler
        if (this.locatorHandler == undefined) {
            let locatorHandler = new LocatorHandler(control_svg, diagram_svg);
            this.locatorHandler = locatorHandler;
            const eventTarget = this.isTargetingDocument() ? document : this.diagram_outer_svg;
            this.registerEventListener(eventTarget, 'mousemove', (evt) => { locatorHandler.drag(evt); });
            this.registerEventListener(eventTarget, 'mouseup', (evt) => { locatorHandler.endDrag(evt); });
            this.registerEventListener(eventTarget, 'touchmove', (evt) => { locatorHandler.drag(evt); });
            this.registerEventListener(eventTarget, 'touchend', (evt) => { locatorHandler.endDrag(evt); });
            this.registerEventListener(eventTarget, 'touchcancel', (evt) => { locatorHandler.endDrag(evt); });
        }
        // ============== callback
        const f_callback = (pos, redraw = true) => {
            this.inp_variables[variable_name] = pos;
            if (callback && redraw)
                callback(variable_name, pos);
            if (redraw)
                this.draw();
        };
        this.locatorHandler.registerCallback(variable_name, f_callback);
        // ============== Circle element
        let locator_svg = this.locatorHandler.create_locator_circle_pointer_svg(variable_name, radius, value, color, blink);
        if (blink) {
            // store the circle_outer into the LocatorHandler so that we can turn it off later
            let blinking_outers = locator_svg.getElementsByClassName("diagramatics-locator-blink");
            for (let i = 0; i < blinking_outers.length; i++)
                this.locatorHandler.addBlinkingCircleOuter(blinking_outers[i]);
        }
        this.registerEventListener(locator_svg, 'mousedown', (evt) => {
            this.locatorHandler.startDrag(evt, variable_name, locator_svg);
        });
        this.registerEventListener(locator_svg, 'touchstart', (evt) => {
            this.locatorHandler.startDrag(evt, variable_name, locator_svg);
        });
        // =============== setter
        let setter;
        if (track_diagram) {
            if (track_diagram.type != DiagramType.Polygon && track_diagram.type != DiagramType.Curve)
                throw Error('Track diagram must be a polygon or curve');
            if (track_diagram.path == undefined)
                throw Error(`diagram {diagtam.type} must have a path`);
            let track = track_diagram.path.points;
            setter = (pos) => {
                let coord = closest_point_from_points(pos, track);
                locator_svg.setAttribute("transform", `translate(${coord.x},${-coord.y})`);
                return coord;
            };
        }
        else {
            setter = (pos) => {
                locator_svg.setAttribute("transform", `translate(${pos.x},${-pos.y})`);
                return pos;
            };
        }
        this.locatorHandler.registerSetter(variable_name, setter);
        this.inp_setter[variable_name] = setter;
        // set initial position
        let init_pos = setter(value);
        this.locatorHandler.setPos(variable_name, init_pos);
    }
    // TODO: in the next breaking changes update,
    // merge this function with locator
    /**
     * Create a locator with custom diagram object
     * @param variable_name name of the variable
     * @param value initial value
     * @param diagram diagram of the locator
     * @param track_diagram if provided, the locator will snap to the closest point on the diagram
     * @param blink if true, the locator will blink
     * @param callback callback function that will be called when the locator is moved
     * @param callback_rightclick callback function that will be called when the locator is right clicked
     */
    locator_custom(variable_name, value, diagram, track_diagram, blink = true, callback, callback_rightclick) {
        if (this.diagram_outer_svg == undefined)
            throw Error("diagram_outer_svg in Interactive class is undefined");
        this.inp_variables[variable_name] = value;
        let diagram_svg = this.get_diagram_svg();
        let control_svg = this.get_svg_element(control_svg_name.locator, !this.locator_svg);
        this.locator_svg = control_svg;
        // if this is the fist time this function is called, create a locatorHandler
        if (this.locatorHandler == undefined) {
            let locatorHandler = new LocatorHandler(control_svg, diagram_svg);
            this.locatorHandler = locatorHandler;
            const eventTarget = this.isTargetingDocument() ? document : this.diagram_outer_svg;
            this.registerEventListener(eventTarget, 'mousemove', (evt) => { locatorHandler.drag(evt); });
            this.registerEventListener(eventTarget, 'mouseup', (evt) => { locatorHandler.endDrag(evt); });
            this.registerEventListener(eventTarget, 'touchmove', (evt) => { locatorHandler.drag(evt); });
            this.registerEventListener(eventTarget, 'touchend', (evt) => { locatorHandler.endDrag(evt); });
            this.registerEventListener(eventTarget, 'touchcancel', (evt) => { locatorHandler.endDrag(evt); });
        }
        // ============== callback
        const f_callback = (pos, redraw = true) => {
            this.inp_variables[variable_name] = pos;
            // don't call the callback on the initialization;
            if (callback && redraw)
                callback(variable_name, pos);
            if (redraw)
                this.draw();
        };
        this.locatorHandler.registerCallback(variable_name, f_callback);
        // ============== SVG element
        let locator_svg = this.locatorHandler.create_locator_diagram_svg(variable_name, diagram, blink);
        this.registerEventListener(locator_svg, 'mousedown', (evt) => {
            this.locatorHandler.startDrag(evt, variable_name, locator_svg);
        });
        this.registerEventListener(locator_svg, 'touchstart', (evt) => {
            this.locatorHandler.startDrag(evt, variable_name, locator_svg);
        });
        if (callback_rightclick) {
            this.registerEventListener(locator_svg, 'contextmenu', (evt) => {
                evt.preventDefault();
                callback_rightclick(variable_name);
            });
        }
        // =============== setter
        let setter;
        if (track_diagram) {
            if (track_diagram.type != DiagramType.Polygon && track_diagram.type != DiagramType.Curve)
                throw Error('Track diagram must be a polygon or curve');
            if (track_diagram.path == undefined)
                throw Error(`diagram {diagtam.type} must have a path`);
            let track = track_diagram.path.points;
            setter = (pos) => {
                let coord = closest_point_from_points(pos, track);
                locator_svg.setAttribute("transform", `translate(${coord.x},${-coord.y})`);
                return coord;
            };
        }
        else {
            setter = (pos) => {
                locator_svg.setAttribute("transform", `translate(${pos.x},${-pos.y})`);
                return pos;
            };
        }
        this.locatorHandler.registerSetter(variable_name, setter);
        this.inp_setter[variable_name] = setter;
        // set initial position
        let init_pos = setter(value);
        this.locatorHandler.setPos(variable_name, init_pos);
    }
    /**
     * Create a slider
     * @param variable_name name of the variable
     * @param min minimum value
     * @param max maximum value
     * @param value initial value
     * @param step step size
     * @param time time of the animation in milliseconds
     * @param display_format_func function to format the display of the value
    */
    slider(variable_name, min = 0, max = 100, value = 50, step = -1, time = 1.5, display_format_func = defaultFormat_f) {
        // if the step is -1, then it is automatically calculated
        if (step == -1) {
            step = (max - min) / 100;
        }
        // initialize the variable
        this.inp_variables[variable_name] = value;
        // =========== label =============
        let labeldiv = document.createElement('div');
        labeldiv.classList.add("diagramatics-label");
        labeldiv.innerHTML = display_format_func(variable_name, value, this.display_precision);
        // =========== slider ===========
        // create the callback function
        const callback = (val, redraw = true) => {
            this.inp_variables[variable_name] = val;
            labeldiv.innerHTML = display_format_func(variable_name, val, this.display_precision);
            if (redraw)
                this.draw();
        };
        let slider = create_slider(callback, min, max, value, step);
        // ================ setter
        const setter = (val) => {
            slider.value = val.toString();
            callback(val, false);
        };
        this.inp_setter[variable_name] = setter;
        // =========== playbutton ========
        let nstep = (max - min) / step;
        const interval_time = 1000 * time / nstep;
        let playbutton = document.createElement('button');
        let symboldiv = document.createElement('div');
        symboldiv.classList.add("diagramatics-slider-playbutton-symbol");
        playbutton.appendChild(symboldiv);
        playbutton.classList.add("diagramatics-slider-playbutton");
        playbutton.onclick = () => {
            if (this.intervals[variable_name] == undefined) {
                // if is not playing
                playbutton.classList.add("paused");
                this.intervals[variable_name] = setInterval(() => {
                    let val = parseFloat(slider.value);
                    val += step;
                    // wrap around
                    val = ((val - min) % (max - min)) + min;
                    slider.value = val.toString();
                    callback(val);
                }, interval_time);
            }
            else {
                // if is playing
                playbutton.classList.remove("paused");
                clearInterval(this.intervals[variable_name]);
                this.intervals[variable_name] = undefined;
            }
        };
        // ==============================
        // add components to div
        //
        // <div class="diagramatics-slider-leftcontainer">
        //     <br>
        //     <button class="diagramatics-slider-playbutton"></button>
        // </div>
        // <div class="diagramatics-slider-rightcontainer">
        //     <div class="diagramatics-label"></div>
        //     <input type="range"class="diagramatics-slider">
        // </div>
        //
        let leftcontainer = document.createElement('div');
        leftcontainer.classList.add("diagramatics-slider-leftcontainer");
        leftcontainer.appendChild(document.createElement('br'));
        leftcontainer.appendChild(playbutton);
        let rightcontainer = document.createElement('div');
        rightcontainer.classList.add("diagramatics-slider-rightcontainer");
        rightcontainer.appendChild(labeldiv);
        rightcontainer.appendChild(slider);
        let container = document.createElement('div');
        container.classList.add("diagramatics-slider-container");
        container.appendChild(leftcontainer);
        container.appendChild(rightcontainer);
        this.control_container_div.appendChild(container);
    }
    init_drag_and_drop() {
        if (this.diagram_outer_svg == undefined)
            throw Error("diagram_outer_svg in Interactive class is undefined");
        let diagram_svg = this.get_diagram_svg();
        let dnd_svg = this.get_svg_element(control_svg_name.dnd, !this.dnd_svg);
        this.dnd_svg = dnd_svg;
        // if this is the fist time this function is called, create a dragAndDropHandler
        if (this.dragAndDropHandler == undefined) {
            let dragAndDropHandler = new DragAndDropHandler(dnd_svg, diagram_svg);
            dragAndDropHandler.focus_padding = this.focus_padding;
            this.dragAndDropHandler = dragAndDropHandler;
            const eventTarget = this.isTargetingDocument() ? document : this.diagram_outer_svg;
            // this.registerEventListener(this.diagram_outer_svg, 'mousemove',  (evt:any) => {dragAndDropHandler.drag(evt);});
            this.registerEventListener(eventTarget, 'mousemove', (evt) => { dragAndDropHandler.drag(evt); });
            this.registerEventListener(eventTarget, 'mouseup', (evt) => { dragAndDropHandler.endDrag(evt); });
            this.registerEventListener(eventTarget, 'touchmove', (evt) => { dragAndDropHandler.drag(evt); });
            this.registerEventListener(eventTarget, 'touchend', (evt) => { dragAndDropHandler.endDrag(evt); });
            this.registerEventListener(eventTarget, 'touchcancel', (evt) => { dragAndDropHandler.endDrag(evt); });
        }
    }
    /**
     * Create a drag and drop container
     * @param name name of the container
     * @param diagram diagram of the container
     * @param capacity capacity of the container (default is 1)
     * @param config configuration of the container positioning
     * the configuration is an object with the following format:
     * `{type:"horizontal-uniform"}`, `{type:"vertical-uniform"}`, `{type:"grid", value:[number, number]}`
     * `{type:"horizontal", padding:number}`, `{type:"vertical", padding:number}`
     * `{type:"flex-row", padding:number, vertical_alignment:VerticalAlignment, horizontal_alignment:HorizontalAlignment}`
     *
     * you can also add custom region box for the target by adding `custom_region_box: [Vector2, Vector2]` in the config
     *
     * you can also add a sorting function for the target by adding `sorting_function: (a: string, b: string) => number`
    */
    dnd_container(name, diagram, capacity, config) {
        var _a;
        this.init_drag_and_drop();
        (_a = this.dragAndDropHandler) === null || _a === void 0 ? void 0 : _a.add_container(name, diagram, capacity, config);
    }
    // TODO: in the next breaking changes update,
    // merge this function with dnd_draggable_to_container
    /**
     * Create a drag and drop draggable that is positioned into an existing container
     * @param name name of the draggable
     * @param diagram diagram of the draggable
     * @param container_name name of the container
     * @param callback callback function (called after the draggable is moved)
     * @param onclickstart_callback callback function (called at the start of the drag)
     */
    dnd_draggable_to_container(name, diagram, container_name, callback, onclickstart_callback) {
        this.init_drag_and_drop();
        if (this.dragAndDropHandler == undefined)
            throw Error("dragAndDropHandler in Interactive class is undefined");
        this.inp_variables[name] = diagram.origin;
        this.dragAndDropHandler.add_draggable_to_container(name, diagram, container_name);
        const dnd_callback = (pos, redraw = true) => {
            this.inp_variables[name] = pos;
            if (callback)
                callback(name, container_name);
            if (redraw)
                this.draw();
        };
        this.dragAndDropHandler.registerCallback(name, dnd_callback);
        if (onclickstart_callback)
            this.dragAndDropHandler.register_clickstart_callback(name, onclickstart_callback);
    }
    /**
     * Create a drag and drop draggable
     * @param name name of the draggable
     * @param diagram diagram of the draggable
     * @param container_diagram diagram of the container, if not provided, a container will be created automatically
     * @param callback callback function (called after the draggable is moved)
     * @param onclickstart_callback callback function (called at the start of the drag)
    */
    dnd_draggable(name, diagram, container_diagram, callback, onclickstart_callback) {
        this.init_drag_and_drop();
        if (this.dragAndDropHandler == undefined)
            throw Error("dragAndDropHandler in Interactive class is undefined");
        this.inp_variables[name] = diagram.origin;
        this.dragAndDropHandler.add_draggable_with_container(name, diagram, container_diagram);
        const dnd_callback = (pos, redraw = true) => {
            this.inp_variables[name] = pos;
            if (callback)
                callback(name, pos);
            if (redraw)
                this.draw();
        };
        this.dragAndDropHandler.registerCallback(name, dnd_callback);
        if (onclickstart_callback)
            this.dragAndDropHandler.register_clickstart_callback(name, onclickstart_callback);
    }
    /**
     * Register a callback function when a draggable is dropped outside of a container
     * @param callback callback function
     */
    dnd_register_drop_outside_callback(callback) {
        var _a;
        this.init_drag_and_drop();
        (_a = this.dragAndDropHandler) === null || _a === void 0 ? void 0 : _a.register_dropped_outside_callback(callback);
    }
    /**
     * Register a validation function when a draggable is moved to a container
     * If the function return false, the draggable will not be moved
     * @param fun validation function
    */
    dnd_register_move_validation_function(fun) {
        var _a;
        this.init_drag_and_drop();
        (_a = this.dragAndDropHandler) === null || _a === void 0 ? void 0 : _a.register_move_validation_function(fun);
    }
    /**
     * Move a draggable to a container
     * @param name name of the draggable
     * @param container_name name of the container
     */
    dnd_move_to_container(name, container_name) {
        var _a;
        (_a = this.dragAndDropHandler) === null || _a === void 0 ? void 0 : _a.try_move_draggable_to_container(name, container_name);
    }
    /**
     * Get the data of the drag and drop objects with the format:
     * `{container:string, content:string[]}[]`
    */
    get_dnd_data() {
        var _a, _b;
        return (_b = (_a = this.dragAndDropHandler) === null || _a === void 0 ? void 0 : _a.getData()) !== null && _b !== void 0 ? _b : [];
    }
    /**
     * Set the data of the drag and drop objects with the format:
     * `{container:string, content:string[]}[]`
     */
    set_dnd_data(data) {
        var _a;
        (_a = this.dragAndDropHandler) === null || _a === void 0 ? void 0 : _a.setData(data);
    }
    /**
    * reorder the tabindex of the containers
    * @param container_names
    */
    dnd_reorder_tabindex(container_names) {
        var _a;
        (_a = this.dragAndDropHandler) === null || _a === void 0 ? void 0 : _a.reorder_svg_container_tabindex(container_names);
    }
    /**
    * Get the content size of a container
    */
    get_dnd_container_content_size(container_name) {
        if (!this.dragAndDropHandler)
            return [NaN, NaN];
        return this.dragAndDropHandler.get_container_content_size(container_name);
    }
    /**
     * Set whether the content of the container should be sorted or not
     */
    set_dnd_content_sort(sort_content) {
        if (!this.dragAndDropHandler)
            return;
        this.dragAndDropHandler.sort_content = sort_content;
    }
    remove_dnd_draggable(name) {
        var _a;
        (_a = this.dragAndDropHandler) === null || _a === void 0 ? void 0 : _a.remove_draggable(name);
    }
    remove_locator(name) {
        var _a;
        (_a = this.locatorHandler) === null || _a === void 0 ? void 0 : _a.remove(name);
    }
    remove_button(name) {
        var _a;
        (_a = this.buttonHandler) === null || _a === void 0 ? void 0 : _a.remove(name);
    }
    /**
     * @deprecated (use `Interactive.custom_object_g()` instead)
     * This method will be removed in the next major release
     *
     * Create a custom interactive object
     * @param id id of the object
     * @param classlist list of classes of the object
     * @param diagram diagram of the object
     * @returns the svg element of the object
     */
    custom_object(id, classlist, diagram) {
        if (this.diagram_outer_svg == undefined)
            throw Error("diagram_outer_svg in Interactive class is undefined");
        let diagram_svg = this.get_diagram_svg();
        let control_svg = this.get_svg_element(control_svg_name.custom, !this.custom_svg);
        let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        f_draw_to_svg(svg, svg, diagram, true, false, calculate_text_scale(diagram_svg));
        svg.setAttribute("overflow", "visible");
        svg.setAttribute("class", classlist.join(" "));
        svg.setAttribute("id", id);
        control_svg.setAttribute("viewBox", diagram_svg.getAttribute("viewBox"));
        control_svg.setAttribute("preserveAspectRatio", diagram_svg.getAttribute("preserveAspectRatio"));
        control_svg.style.overflow = "visible";
        control_svg.appendChild(svg);
        this.custom_svg = control_svg;
        return svg;
    }
    /**
     * Create a custom interactive object
     * @param id id of the object
     * @param classlist list of classes of the object
     * @param diagram diagram of the object
     * @returns the <g> svg element of the object
     */
    custom_object_g(id, classlist, diagram) {
        if (this.diagram_outer_svg == undefined)
            throw Error("diagram_outer_svg in Interactive class is undefined");
        let diagram_svg = this.get_diagram_svg();
        let control_svg = this.get_svg_element(control_svg_name.custom, !this.custom_svg);
        let g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        f_draw_to_svg(control_svg, g, diagram, true, false, calculate_text_scale(diagram_svg));
        g.setAttribute("overflow", "visible");
        g.setAttribute("class", classlist.join(" "));
        g.setAttribute("id", id);
        control_svg.setAttribute("viewBox", diagram_svg.getAttribute("viewBox"));
        control_svg.setAttribute("preserveAspectRatio", diagram_svg.getAttribute("preserveAspectRatio"));
        control_svg.style.overflow = "visible";
        control_svg.appendChild(g);
        this.custom_svg = control_svg;
        return g;
    }
    init_button() {
        if (this.diagram_outer_svg == undefined)
            throw Error("diagram_outer_svg in Interactive class is undefined");
        let diagram_svg = this.get_diagram_svg();
        let button_svg = this.get_svg_element(control_svg_name.button, !this.button_svg);
        this.button_svg = button_svg;
        // if this is the fist time this function is called, create a dragAndDropHandler
        if (this.buttonHandler == undefined) {
            let buttonHandler = new ButtonHandler(button_svg, diagram_svg);
            buttonHandler.focus_padding = this.focus_padding;
            this.buttonHandler = buttonHandler;
        }
    }
    /**
     * Create a toggle button
     * @param name name of the button
     * @param diagram_on diagram of the button when it is on
     * @param diagram_off diagram of the button when it is off
     * @param state initial state of the button
     * @param callback callback function when the button state is changed
    */
    button_toggle(name, diagram_on, diagram_off, state = false, callback) {
        this.init_button();
        if (this.buttonHandler == undefined)
            throw Error("buttonHandler in Interactive class is undefined");
        this.inp_variables[name] = state;
        let main_callback;
        if (callback) {
            main_callback = (state, redraw = true) => {
                this.inp_variables[name] = state;
                callback(name, state);
                if (redraw)
                    this.draw();
            };
        }
        else {
            main_callback = (state, redraw = true) => {
                this.inp_variables[name] = state;
                if (redraw)
                    this.draw();
            };
        }
        let setter = this.buttonHandler.try_add_toggle(name, diagram_on, diagram_off, state, main_callback);
        this.inp_setter[name] = setter;
    }
    /**
     * Create a click button
     * @param name name of the button
     * @param diagram diagram of the button
     * @param diagram_pressed diagram of the button when it is pressed
     * @param callback callback function when the button is clicked
    */
    button_click(name, diagram, diagram_pressed, callback) {
        this.init_button();
        if (this.buttonHandler == undefined)
            throw Error("buttonHandler in Interactive class is undefined");
        let n_callback = () => { callback(); this.draw(); };
        this.buttonHandler.try_add_click(name, diagram, diagram_pressed, diagram, n_callback);
    }
    /**
     * Create a click button
     * @param name name of the button
     * @param diagram diagram of the button
     * @param diagram_pressed diagram of the button when it is pressed
     * @param diagram_hover diagram of the button when it is hovered
     * @param callback callback function when the button is clicked
    */
    button_click_hover(name, diagram, diagram_pressed, diagram_hover, callback) {
        this.init_button();
        if (this.buttonHandler == undefined)
            throw Error("buttonHandler in Interactive class is undefined");
        let n_callback = () => { callback(); this.draw(); };
        this.buttonHandler.try_add_click(name, diagram, diagram_pressed, diagram_hover, n_callback);
    }
}
// ========== functions
//
function set_viewbox(taget, source) {
    if (taget == undefined)
        return;
    if (source == undefined)
        return;
    taget.setAttribute("viewBox", source.getAttribute("viewBox"));
    taget.setAttribute("preserveAspectRatio", source.getAttribute("preserveAspectRatio"));
}
function create_slider(callback, min = 0, max = 100, value = 50, step) {
    // create a slider
    let slider = document.createElement("input");
    slider.type = "range";
    slider.min = min.toString();
    slider.max = max.toString();
    slider.value = value.toString();
    slider.step = step.toString();
    slider.oninput = () => {
        let val = slider.value;
        callback(parseFloat(val));
    };
    // add class to slider
    slider.classList.add("diagramatics-slider");
    return slider;
}
// function create_locator() : SVGCircleElement {
// }
//
function closest_point_from_points(p, points) {
    if (points.length == 0)
        return p;
    let closest_d2 = Infinity;
    let closest_p = points[0];
    for (let i = 0; i < points.length; i++) {
        let d2 = points[i].sub(p).length_sq();
        if (d2 < closest_d2) {
            closest_d2 = d2;
            closest_p = points[i];
        }
    }
    return closest_p;
}
// helper to calculate CTM in firefox
// there's a well known bug in firefox about `getScreenCTM()`
function firefox_calcCTM(svgelem) {
    let ctm = svgelem.getScreenCTM();
    // get screen width and height of the element
    let screenWidth = svgelem.width.baseVal.value;
    let screenHeight = svgelem.height.baseVal.value;
    let viewBox = svgelem.viewBox.baseVal;
    let scalex = screenWidth / viewBox.width;
    let scaley = screenHeight / viewBox.height;
    let scale = Math.min(scalex, scaley);
    // let translateX = (screenWidth/2  + ctm.e) - (viewBox.width/2  + viewBox.x) * scale;
    // let translateY = (screenHeight/2 + ctm.f) - (viewBox.height/2 + viewBox.y) * scale;
    let translateX = (screenWidth / 2) - (viewBox.width / 2 + viewBox.x) * scale;
    let translateY = (screenHeight / 2) - (viewBox.height / 2 + viewBox.y) * scale;
    return DOMMatrix.fromMatrix(ctm).translate(translateX, translateY).scale(scale);
}
/**
 * Convert client position to SVG position
 * @param clientPos the client position
 * @param svgelem the svg element
 */
function clientPos_to_svgPos(clientPos, svgelem) {
    // var CTM = this.control_svg.getScreenCTM() as DOMMatrix;
    // NOTE: there's a well known bug in firefox about `getScreenCTM()`
    // check if the browser is firefox
    let CTM;
    if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
        CTM = firefox_calcCTM(svgelem);
    }
    else {
        CTM = svgelem.getScreenCTM();
    }
    // console.log(CTM);
    return {
        x: (clientPos.x - CTM.e) / CTM.a,
        y: -(clientPos.y - CTM.f) / CTM.d
    };
}
function getMousePosition(evt, svgelem) {
    // firefox doesn't support `TouchEvent`, we need to check for it
    if (window.TouchEvent && evt instanceof TouchEvent) {
        evt = evt.touches[0];
    }
    let clientPos = {
        x: evt.clientX,
        y: evt.clientY
    };
    return clientPos_to_svgPos(clientPos, svgelem);
}
/**
 * Get the SVG coordinate from the event (MouseEvent or TouchEvent)
 * @param evt the event
 * @param svgelem the svg element
 * @returns the SVG coordinate
 */
function get_SVGPos_from_event(evt, svgelem) {
    return getMousePosition(evt, svgelem);
}
class LocatorHandler {
    constructor(control_svg, diagram_svg) {
        this.control_svg = control_svg;
        this.diagram_svg = diagram_svg;
        this.selectedElement = null;
        this.selectedVariable = null;
        this.mouseOffset = V2(0, 0);
        this.callbacks = {};
        this.setter = {};
        // store blinking circle_outer so that we can turn it off
        this.svg_elements = {};
        this.blinking_circle_outers = [];
        this.first_touch_callback = null;
        this.element_pos = {};
    }
    startDrag(evt, variable_name, selectedElement) {
        this.selectedElement = selectedElement;
        this.selectedVariable = variable_name;
        if (evt instanceof MouseEvent) {
            evt.preventDefault();
        }
        if (window.TouchEvent && evt instanceof TouchEvent) {
            evt.preventDefault();
        }
        let coord = getMousePosition(evt, this.control_svg);
        let mousepos = V2(coord.x, coord.y);
        let elementpos = this.element_pos[variable_name];
        if (elementpos) {
            this.mouseOffset = elementpos.sub(mousepos);
        }
        this.handleBlinking();
    }
    drag(evt) {
        if (this.selectedElement == undefined)
            return;
        if (this.selectedVariable == undefined)
            return;
        if (evt instanceof MouseEvent) {
            evt.preventDefault();
        }
        if (window.TouchEvent && evt instanceof TouchEvent) {
            evt.preventDefault();
        }
        let coord = getMousePosition(evt, this.control_svg);
        let pos = V2(coord.x, coord.y).add(this.mouseOffset);
        this.element_pos[this.selectedVariable] = pos;
        // check if setter for this.selectedVariable exists
        // if it does, call it
        if (this.setter[this.selectedVariable] != undefined) {
            pos = this.setter[this.selectedVariable](pos);
        }
        // check if callback for this.selectedVariable exists
        // if it does, call it
        if (this.selectedVariable == null)
            return;
        if (this.callbacks[this.selectedVariable] != undefined) {
            this.callbacks[this.selectedVariable](pos);
        }
        this.setViewBox();
    }
    setViewBox() {
        // set viewBox and preserveAspectRatio of control_svg to be the same as diagram_svg
        this.control_svg.setAttribute("viewBox", this.diagram_svg.getAttribute("viewBox"));
        this.control_svg.setAttribute("preserveAspectRatio", this.diagram_svg.getAttribute("preserveAspectRatio"));
    }
    endDrag(_) {
        this.selectedElement = null;
        this.selectedVariable = null;
    }
    remove(variable_name) {
        var _a;
        if (this.selectedVariable == variable_name) {
            this.selectedElement = null;
            this.selectedVariable = null;
        }
        delete this.callbacks[variable_name];
        delete this.setter[variable_name];
        (_a = this.svg_elements[variable_name]) === null || _a === void 0 ? void 0 : _a.remove();
        delete this.svg_elements[variable_name];
        delete this.element_pos[variable_name];
    }
    setPos(name, pos) {
        this.element_pos[name] = pos;
        this.callbacks[name](pos, false);
    }
    registerCallback(name, callback) {
        this.callbacks[name] = callback;
    }
    registerSetter(name, setter) {
        this.setter[name] = setter;
    }
    addBlinkingCircleOuter(circle_outer) {
        this.blinking_circle_outers.push(circle_outer);
    }
    handleBlinking() {
        // turn off all blinking_circle_outers after the first touch
        if (this.blinking_circle_outers.length == 0)
            return;
        for (let i = 0; i < this.blinking_circle_outers.length; i++) {
            this.blinking_circle_outers[i].classList.remove("diagramatics-locator-blink");
        }
        this.blinking_circle_outers = [];
        if (this.first_touch_callback != null)
            this.first_touch_callback();
    }
    create_locator_diagram_svg(name, diagram, blink) {
        let g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        f_draw_to_svg(this.control_svg, g, diagram.position(V2(0, 0)), true, false, calculate_text_scale(this.diagram_svg));
        g.style.cursor = "pointer";
        g.setAttribute("overflow", "visible");
        if (blink) {
            g.classList.add("diagramatics-locator-blink");
            this.addBlinkingCircleOuter(g);
        }
        if (this.svg_elements[name]) {
            this.svg_elements[name].replaceWith(g);
        }
        else {
            this.control_svg.appendChild(g);
        }
        this.svg_elements[name] = g;
        this.element_pos[name];
        return g;
    }
    create_locator_circle_pointer_svg(name, radius, value, color, blink) {
        let g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        // set svg overflow to visible
        g.setAttribute("overflow", "visible");
        // set cursor to be pointer when hovering
        g.style.cursor = "pointer";
        let circle_outer = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        let circle_inner = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        let inner_radius = radius * 0.4;
        circle_outer.setAttribute("r", radius.toString());
        circle_outer.setAttribute("fill", get_color(color, tab_color));
        circle_outer.setAttribute("fill-opacity", "0.3137");
        circle_outer.setAttribute("stroke", "none");
        circle_outer.classList.add("diagramatics-locator-outer");
        if (blink)
            circle_outer.classList.add("diagramatics-locator-blink");
        circle_inner.setAttribute("r", inner_radius.toString());
        circle_inner.setAttribute("fill", get_color(color, tab_color));
        circle_inner.setAttribute("stroke", "none");
        circle_inner.classList.add("diagramatics-locator-inner");
        g.appendChild(circle_outer);
        g.appendChild(circle_inner);
        g.setAttribute("transform", `translate(${value.x},${-value.y})`);
        if (this.svg_elements[name]) {
            this.svg_elements[name].replaceWith(g);
        }
        else {
            this.control_svg.appendChild(g);
        }
        this.svg_elements[name] = g;
        return g;
    }
}
var dnd_type;
(function (dnd_type) {
    dnd_type["container"] = "diagramatics-dnd-container";
    dnd_type["draggable"] = "diagramatics-dnd-draggable";
    dnd_type["ghost"] = "diagramatics-dnd-draggable-ghost";
})(dnd_type || (dnd_type = {}));
class DragAndDropHandler {
    constructor(dnd_svg, diagram_svg) {
        this.dnd_svg = dnd_svg;
        this.diagram_svg = diagram_svg;
        this.containers = {};
        this.draggables = {};
        this.callbacks = {};
        this.onclickstart_callback = {};
        this.hoveredContainerName = null;
        this.draggedElementName = null;
        this.draggedElementGhost = null;
        this.dropped_outside_callback = null;
        this.move_validation_function = null;
        this.sort_content = false;
        this.active_draggable_name = null; // active from tap/enter
        this.focus_padding = 1;
        this.dom_to_id_map = new WeakMap();
    }
    add_container(name, diagram, capacity, config) {
        if (this.containers[name] != undefined) {
            this.replace_container_svg(name, diagram, capacity, config);
            return;
        }
        this.containers[name] = {
            name, diagram,
            position: diagram.origin,
            content: [],
            config: config !== null && config !== void 0 ? config : { type: "horizontal-uniform" },
            capacity: capacity !== null && capacity !== void 0 ? capacity : 1
        };
    }
    generate_position_map(bbox, config, capacity, content) {
        var _a;
        const p_center = bbox[0].add(bbox[1]).scale(0.5);
        switch (config.type) {
            case "horizontal-uniform": {
                let width = bbox[1].x - bbox[0].x;
                let dx = width / capacity;
                let x0 = bbox[0].x + dx / 2;
                let y = p_center.y;
                return range(0, capacity).map(i => V2(x0 + dx * i, y));
            }
            case "vertical-uniform": {
                //NOTE: top to bottom
                let height = bbox[1].y - bbox[0].y;
                let dy = height / capacity;
                let x = p_center.x;
                let y0 = bbox[1].y - dy / 2;
                return range(0, capacity).map(i => V2(x, y0 - dy * i));
            }
            case "grid": {
                let [nx, ny] = config.value;
                let height = bbox[1].y - bbox[0].y;
                let width = bbox[1].x - bbox[0].x;
                let dx = width / nx;
                let dy = height / ny;
                let x0 = bbox[0].x + dx / 2;
                let y0 = bbox[1].y - dy / 2;
                return range(0, capacity).map(i => {
                    let x = x0 + dx * (i % nx);
                    let y = y0 - dy * Math.floor(i / nx);
                    return V2(x, y);
                });
            }
            case "vertical": {
                const p_top_center = V2(p_center.x, bbox[1].y);
                const sizelist = content.map((name) => { var _a, _b; return (_b = (_a = this.draggables[name]) === null || _a === void 0 ? void 0 : _a.diagram_size) !== null && _b !== void 0 ? _b : [0, 0]; });
                const size_rects = sizelist.map(([w, h]) => rectangle(w, h).mut());
                const distributed = distribute_vertical_and_align(size_rects, config.padding).mut()
                    .move_origin('top-center').position(p_top_center)
                    .translate(V2(0, -config.padding));
                return distributed.children.map(d => d.origin);
            }
            case "horizontal": {
                const p_center_left = V2(bbox[0].x, p_center.y);
                const sizelist = content.map((name) => { var _a, _b; return (_b = (_a = this.draggables[name]) === null || _a === void 0 ? void 0 : _a.diagram_size) !== null && _b !== void 0 ? _b : [0, 0]; });
                const size_rects = sizelist.map(([w, h]) => rectangle(w, h).mut());
                const distributed = distribute_horizontal_and_align(size_rects, config.padding).mut()
                    .move_origin('center-left').position(p_center_left)
                    .translate(V2(config.padding, 0));
                return distributed.children.map(d => d.origin);
            }
            case "flex-row": {
                const pad = (_a = config.padding) !== null && _a !== void 0 ? _a : 0;
                const container_width = bbox[1].x - bbox[0].x - 2 * pad;
                const sizelist = content.map((name) => { var _a, _b; return (_b = (_a = this.draggables[name]) === null || _a === void 0 ? void 0 : _a.diagram_size) !== null && _b !== void 0 ? _b : [0, 0]; });
                const size_rects = sizelist.map(([w, h]) => rectangle(w, h).mut());
                let distributed = distribute_variable_row(size_rects, container_width, pad, pad, config.vertical_alignment, config.horizontal_alignment).mut();
                switch (config.horizontal_alignment) {
                    case 'center':
                        {
                            distributed = distributed
                                .move_origin('top-center').position(V2(p_center.x, bbox[1].y - pad));
                        }
                        break;
                    case 'right':
                        {
                            distributed = distributed
                                .move_origin('top-right').position(V2(bbox[1].x - pad, bbox[1].y - pad));
                        }
                        break;
                    case 'center':
                    default: {
                        distributed = distributed
                            .move_origin('top-left').position(V2(bbox[0].x + pad, bbox[1].y - pad));
                    }
                }
                return distributed.children.map(d => d.origin);
            }
            default: {
                return [];
            }
        }
    }
    get_container_content_size(container_name) {
        var _a;
        const container = this.containers[container_name];
        if (container == undefined)
            return [NaN, NaN];
        const pad = (_a = container.config.padding) !== null && _a !== void 0 ? _a : 0;
        const content_diagrams = container.content.map(name => { var _a, _b; return (_b = (_a = this.draggables[name]) === null || _a === void 0 ? void 0 : _a.diagram) !== null && _b !== void 0 ? _b : empty(); });
        const [width, height] = size(diagram_combine(...content_diagrams));
        return [width + 2 * pad, height + 2 * pad];
    }
    replace_draggable_svg(name, diagram) {
        var _a, _b;
        let draggable = this.draggables[name];
        if (draggable == undefined)
            return;
        let outer_g = (_a = draggable.svgelement) === null || _a === void 0 ? void 0 : _a.parentNode;
        if (outer_g == undefined)
            return;
        (_b = draggable.svgelement) === null || _b === void 0 ? void 0 : _b.remove();
        draggable.diagram = diagram;
        draggable.diagram_size = size(diagram);
        this.add_draggable_svg(name, diagram, outer_g);
        this.reposition_container_content(draggable.container);
    }
    replace_container_svg(name, diagram, capacity, config) {
        var _a;
        let container = this.containers[name];
        if (container == undefined)
            return;
        const outer_g = this.get_container_outer_g(name);
        if (outer_g == undefined)
            return;
        (_a = container.svgelement) === null || _a === void 0 ? void 0 : _a.remove();
        container.diagram = diagram;
        if (capacity)
            container.capacity = capacity;
        if (config)
            container.config = config;
        this.add_container_svg(name, diagram, outer_g);
        this.reposition_container_content(name);
    }
    add_draggable_to_container(name, diagram, container_name) {
        if (this.draggables[name] != undefined) {
            this.replace_draggable_svg(name, diagram);
            this.move_draggable_to_container(name, container_name, true);
            return;
        }
        const diagram_size = size(diagram);
        this.draggables[name] = { name, diagram: diagram.mut(), diagram_size, position: diagram.origin, container: container_name };
        this.containers[container_name].content.push(name);
    }
    add_draggable_with_container(name, diagram, container_diagram) {
        if (this.draggables[name] != undefined) {
            this.replace_draggable_svg(name, diagram);
            return;
        }
        // add a container as initial container for the draggable
        let initial_container_name = `_container0_${name}`;
        if (container_diagram == undefined)
            container_diagram = this.diagram_container_from_draggable(diagram);
        this.add_container(initial_container_name, container_diagram);
        const diagram_size = size(diagram);
        this.containers[initial_container_name].content.push(name);
        this.draggables[name] = { name, diagram: diagram.mut(), diagram_size, position: diagram.origin, container: initial_container_name };
    }
    remove_draggable(name) {
        var _a;
        for (let container_name in this.containers) {
            const container = this.containers[container_name];
            container.content = container.content.filter(e => e != name);
        }
        (_a = this.draggables[name].svgelement) === null || _a === void 0 ? void 0 : _a.remove();
        delete this.draggables[name];
    }
    registerCallback(name, callback) {
        this.callbacks[name] = callback;
    }
    register_clickstart_callback(name, callback) {
        this.onclickstart_callback[name] = callback;
    }
    register_dropped_outside_callback(callback) {
        this.dropped_outside_callback = callback;
    }
    register_move_validation_function(fun) {
        this.move_validation_function = fun;
    }
    setViewBox() {
        // set viewBox and preserveAspectRatio of control_svg to be the same as diagram_svg
        this.dnd_svg.setAttribute("viewBox", this.diagram_svg.getAttribute("viewBox"));
        this.dnd_svg.setAttribute("preserveAspectRatio", this.diagram_svg.getAttribute("preserveAspectRatio"));
    }
    drawSvg() {
        for (let container_name in this.containers) {
            const container_data = this.containers[container_name];
            if ((container_data === null || container_data === void 0 ? void 0 : container_data.svgelement) == undefined) {
                const outer_g = document.createElementNS("http://www.w3.org/2000/svg", "g");
                this.dnd_svg.append(outer_g);
                this.add_container_svg(container_name, container_data.diagram, outer_g);
            }
            const outer_g = this.get_container_outer_g(container_name);
            if (outer_g == undefined)
                continue;
            for (let draggable_name of container_data.content) {
                const draggable_data = this.draggables[draggable_name];
                if (draggable_data === null || draggable_data === void 0 ? void 0 : draggable_data.svgelement)
                    continue;
                this.add_draggable_svg(draggable_name, draggable_data.diagram, outer_g);
            }
        }
        for (let name in this.containers) {
            this.reposition_container_content(name);
            this.reconfigure_container_tabindex(name);
        }
    }
    getData() {
        let data = [];
        for (let name in this.containers) {
            data.push({ container: name, content: this.containers[name].content });
        }
        return data;
    }
    setData(data) {
        try {
            for (let containerdata of data) {
                for (let content of containerdata.content) {
                    this.try_move_draggable_to_container(content, containerdata.container, true);
                }
            }
        }
        catch (_e) {
            console.error("the data is not valid");
        }
    }
    diagram_container_from_draggable(diagram) {
        let rect = rectangle_corner(...diagram.bounding_box()).move_origin(diagram.origin);
        return rect.strokedasharray([5]);
    }
    register_tap_enter(g, callback) {
        g.onclick = (e) => {
            callback(false);
        };
        g.onkeydown = (evt) => {
            if (evt.key == "Enter")
                callback(true);
        };
    }
    tap_enter_draggable(draggable_name, keyboard) {
        var _a, _b, _c;
        if (this.active_draggable_name == null) {
            // select the draggable
            this.reset_picked_class();
            this.active_draggable_name = draggable_name;
            let draggable = this.draggables[draggable_name];
            if (draggable.svgelement == undefined)
                return;
            draggable.svgelement.classList.add("picked");
            if (keyboard)
                (_b = (_a = this.onclickstart_callback)[draggable_name]) === null || _b === void 0 ? void 0 : _b.call(_a);
        }
        else if (draggable_name == this.active_draggable_name) {
            // unselect the draggable
            this.reset_picked_class();
            this.active_draggable_name = null;
        }
        else {
            // try to switch if possible
            const target_container = (_c = this.draggables[draggable_name]) === null || _c === void 0 ? void 0 : _c.container;
            if (target_container) {
                this.try_move_draggable_to_container(this.active_draggable_name, target_container);
            }
            this.reset_picked_class();
            this.active_draggable_name = null;
        }
    }
    tap_enter_container(container_name) {
        if (this.active_draggable_name == null)
            return;
        this.try_move_draggable_to_container(this.active_draggable_name, container_name);
        this.active_draggable_name = null;
        this.reset_picked_class();
    }
    get_container_outer_g(container_name) {
        var _a;
        const container_data = this.containers[container_name];
        return (_a = container_data === null || container_data === void 0 ? void 0 : container_data.svgelement) === null || _a === void 0 ? void 0 : _a.parentNode;
    }
    add_container_svg(name, diagram, outer_g) {
        let g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        f_draw_to_svg(this.dnd_svg, g, diagram.position(V2(0, 0)), false, false, calculate_text_scale(this.diagram_svg), dnd_type.container);
        let position = diagram.origin;
        g.setAttribute("transform", `translate(${position.x},${-position.y})`);
        g.setAttribute("class", dnd_type.container);
        g.setAttribute("tabindex", "0");
        g.onmousedown = (e) => {
            e.preventDefault();
        };
        this.register_tap_enter(g, () => {
            this.tap_enter_container(name);
        });
        outer_g.prepend(g);
        this.containers[name].svgelement = g;
        this.dom_to_id_map.set(g, name);
        this.add_focus_rect(g, diagram);
    }
    add_draggable_svg(name, diagram, outer_g) {
        let g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        f_draw_to_svg(this.dnd_svg, g, diagram.position(V2(0, 0)), true, false, calculate_text_scale(this.diagram_svg), dnd_type.draggable);
        let position = diagram.origin;
        g.setAttribute("transform", `translate(${position.x},${-position.y})`);
        g.setAttribute("class", dnd_type.draggable);
        g.setAttribute("draggable", "true");
        g.setAttribute("tabindex", "0");
        g.onmousedown = (evt) => {
            this.draggedElementName = name;
            this.startDrag(evt);
        };
        g.ontouchstart = (evt) => {
            this.draggedElementName = name;
            this.tap_enter_draggable(name);
            this.startDrag(evt);
        };
        this.register_tap_enter(g, (keyboard) => {
            this.tap_enter_draggable(name, keyboard);
        });
        outer_g.append(g);
        this.draggables[name].svgelement = g;
        this.dom_to_id_map.set(g, name);
        this.add_focus_rect(g, diagram);
    }
    add_focus_rect(g, diagram) {
        const bbox = diagram.position(V2(0, 0)).bounding_box();
        const pad = this.focus_padding;
        const width = bbox[1].x - bbox[0].x + 2 * pad;
        const height = bbox[1].y - bbox[0].y + 2 * pad;
        // focus rect svg element
        const focus_rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        focus_rect.setAttribute("width", width.toString());
        focus_rect.setAttribute("height", height.toString());
        focus_rect.setAttribute("x", (bbox[0].x - pad).toString());
        focus_rect.setAttribute("y", (-bbox[1].y - pad).toString());
        focus_rect.setAttribute("fill", "none");
        focus_rect.setAttribute("stroke", "black");
        focus_rect.setAttribute("stroke-width", "1");
        focus_rect.setAttribute("vector-effect", "non-scaling-stroke");
        focus_rect.setAttribute("class", FOCUS_RECT_CLASSNAME);
        g.appendChild(focus_rect);
    }
    move_svg_draggable_to_container(draggable_name, container_name) {
        var _a;
        const draggable_svg = (_a = this.draggables[draggable_name]) === null || _a === void 0 ? void 0 : _a.svgelement;
        if (draggable_svg == undefined)
            return;
        const container_outer_g = this.get_container_outer_g(container_name);
        if (container_outer_g == undefined)
            return;
        container_outer_g.appendChild(draggable_svg);
    }
    reorder_svg_container_content(container_name) {
        var _a, _b;
        const content = (_a = this.containers[container_name]) === null || _a === void 0 ? void 0 : _a.content;
        const g = this.get_container_outer_g(container_name);
        if (content == undefined || g == undefined)
            return;
        for (let draggable_name of content) {
            const draggable_svg = (_b = this.draggables[draggable_name]) === null || _b === void 0 ? void 0 : _b.svgelement;
            if (draggable_svg == undefined)
                continue;
            g.appendChild(draggable_svg);
        }
    }
    reconfigure_container_tabindex(container_name) {
        var _a, _b, _c, _d;
        const container = this.containers[container_name];
        if (container == undefined)
            return;
        if (container.capacity == 1) {
            if (container.content.length == 1) {
                (_a = container.svgelement) === null || _a === void 0 ? void 0 : _a.setAttribute("tabindex", "-1");
                if (container.svgelement == document.activeElement) {
                    // set the focus to the content
                    const content = container.content[0];
                    (_c = (_b = this.draggables[content]) === null || _b === void 0 ? void 0 : _b.svgelement) === null || _c === void 0 ? void 0 : _c.focus();
                }
            }
            else {
                (_d = container.svgelement) === null || _d === void 0 ? void 0 : _d.setAttribute("tabindex", "0");
            }
        }
    }
    reorder_svg_container_tabindex(container_names) {
        for (let container_name of container_names) {
            const g = this.get_container_outer_g(container_name);
            if (g == undefined)
                continue;
            this.dnd_svg.appendChild(g);
        }
    }
    reposition_container_content(container_name) {
        var _a, _b, _c, _d;
        let container = this.containers[container_name];
        if (container == undefined)
            return;
        if (this.sort_content) {
            container.content.sort();
            this.reorder_svg_container_content(container_name);
        }
        else if ((_a = container.config) === null || _a === void 0 ? void 0 : _a.sorting_function) {
            container.content.sort(container.config.sorting_function);
            this.reorder_svg_container_content(container_name);
        }
        const bbox = (_b = container.config.custom_region_box) !== null && _b !== void 0 ? _b : container.diagram.bounding_box();
        const position_map = this.generate_position_map(bbox, container.config, container.capacity, container.content);
        for (let i = 0; i < container.content.length; i++) {
            let draggable = this.draggables[container.content[i]];
            let pos = (_c = position_map[i]) !== null && _c !== void 0 ? _c : container.diagram.origin;
            draggable.diagram = draggable.diagram.position(pos);
            draggable.position = pos;
            (_d = draggable.svgelement) === null || _d === void 0 ? void 0 : _d.setAttribute("transform", `translate(${pos.x},${-pos.y})`);
        }
    }
    remove_draggable_from_container(draggable_name, container_name) {
        this.containers[container_name].content =
            this.containers[container_name].content.filter((name) => name != draggable_name);
    }
    move_draggable_to_container(draggable_name, container_name, ignore_callback = false) {
        let draggable = this.draggables[draggable_name];
        if (draggable == undefined)
            return;
        // ignore if the draggable is already in the container
        if (draggable.container == container_name)
            return;
        let container = this.containers[container_name];
        let original_container_name = draggable.container;
        this.remove_draggable_from_container(draggable_name, original_container_name);
        draggable.container = container_name;
        container.content.push(draggable_name);
        this.move_svg_draggable_to_container(draggable_name, container_name);
        this.reposition_container_content(container_name);
        this.reposition_container_content(original_container_name);
        this.reconfigure_container_tabindex(container_name);
        this.reconfigure_container_tabindex(original_container_name);
        if (ignore_callback)
            return;
        let draggedElement = this.draggables[draggable_name];
        this.callbacks[draggedElement.name](draggedElement.position);
    }
    try_move_draggable_to_container(draggable_name, container_name, ignore_callback = false) {
        if (this.move_validation_function) {
            const valid = this.move_validation_function(draggable_name, container_name);
            if (!valid)
                return;
        }
        let draggable = this.draggables[draggable_name];
        let container = this.containers[container_name];
        if (container.content.length + 1 <= container.capacity) {
            this.move_draggable_to_container(draggable_name, container_name, ignore_callback);
        }
        else if (container.capacity == 1) {
            // only swap if the container has only 1 capacity
            // swap
            let original_container_name = draggable.container;
            let other_draggable_name = container.content[0];
            this.move_draggable_to_container(draggable_name, container_name, true);
            this.move_draggable_to_container(other_draggable_name, original_container_name, ignore_callback);
        }
    }
    startDrag(evt) {
        var _a, _b;
        if (evt instanceof MouseEvent) {
            evt.preventDefault();
        }
        if (window.TouchEvent && evt instanceof TouchEvent) {
            evt.preventDefault();
        }
        this.hoveredContainerName = null;
        // reset container hovered class
        this.reset_hovered_class();
        // delete orphaned ghost
        let ghosts = this.dnd_svg.getElementsByClassName(dnd_type.ghost);
        for (let i = 0; i < ghosts.length; i++)
            ghosts[i].remove();
        // create a clone of the dragged element
        if (this.draggedElementName == null)
            return;
        let draggable = this.draggables[this.draggedElementName];
        if (draggable.svgelement == undefined)
            return;
        draggable.svgelement.classList.add("picked");
        (_b = (_a = this.onclickstart_callback)[this.draggedElementName]) === null || _b === void 0 ? void 0 : _b.call(_a);
        this.draggedElementGhost = draggable.svgelement.cloneNode(true);
        // set pointer-events : none
        this.draggedElementGhost.style.pointerEvents = "none";
        this.draggedElementGhost.setAttribute("opacity", "0.5");
        this.draggedElementGhost.setAttribute("class", dnd_type.ghost);
        this.dnd_svg.append(this.draggedElementGhost);
    }
    get_dnd_element_data_from_evt(evt) {
        let element = null;
        if (window.TouchEvent && evt instanceof TouchEvent) {
            let evt_touch = evt.touches[0];
            element = document.elementFromPoint(evt_touch.clientX, evt_touch.clientY);
        }
        else {
            const evt_ = evt;
            element = document.elementFromPoint(evt_.clientX, evt_.clientY);
        }
        if (element == null)
            return null;
        if (element.localName == "tspan")
            element = element.parentElement;
        if (element == null)
            return null;
        let dg_tag = element.getAttribute("_dg_tag");
        if (dg_tag == null)
            return null;
        if (dg_tag == dnd_type.container) {
            let parent = element.parentElement;
            if (parent == null)
                return null;
            let name = this.dom_to_id_map.get(parent);
            if (name == null)
                return null;
            return { name, type: dnd_type.container };
        }
        if (dg_tag == dnd_type.draggable) {
            let parent = element.parentElement;
            if (parent == null)
                return null;
            let name = this.dom_to_id_map.get(parent);
            if (name == null)
                return null;
            return { name, type: dnd_type.draggable };
        }
        return null;
    }
    drag(evt) {
        var _a, _b, _c;
        if (this.draggedElementName == null)
            return;
        if (this.draggedElementGhost == null)
            return;
        if (evt instanceof MouseEvent) {
            evt.preventDefault();
        }
        if (window.TouchEvent && evt instanceof TouchEvent) {
            evt.preventDefault();
        }
        this.reset_hovered_class();
        let element_data = this.get_dnd_element_data_from_evt(evt);
        if (element_data == null) {
            this.hoveredContainerName = null;
        }
        else if (element_data.type == dnd_type.container) {
            this.hoveredContainerName = element_data.name;
            (_a = this.containers[element_data.name].svgelement) === null || _a === void 0 ? void 0 : _a.classList.add("hovered");
        }
        else if (element_data.type == dnd_type.draggable) {
            this.hoveredContainerName = (_b = this.draggables[element_data.name]) === null || _b === void 0 ? void 0 : _b.container;
            (_c = this.draggables[element_data.name].svgelement) === null || _c === void 0 ? void 0 : _c.classList.add("hovered");
        }
        let coord = getMousePosition(evt, this.dnd_svg);
        this.draggedElementGhost.setAttribute("transform", `translate(${coord.x},${-coord.y})`);
    }
    endDrag(_evt) {
        if (this.hoveredContainerName != null && this.draggedElementName != null) {
            this.try_move_draggable_to_container(this.draggedElementName, this.hoveredContainerName);
        }
        // if dropped outside of any container
        if (this.hoveredContainerName == null && this.draggedElementName != null
            && this.dropped_outside_callback != null) {
            this.dropped_outside_callback(this.draggedElementName);
        }
        this.draggedElementName = null;
        this.hoveredContainerName = null;
        this.reset_hovered_class();
        this.reset_picked_class();
        if (this.draggedElementGhost != null) {
            this.draggedElementGhost.remove();
            this.draggedElementGhost = null;
        }
    }
    reset_hovered_class() {
        var _a, _b;
        for (let name in this.containers) {
            (_a = this.containers[name].svgelement) === null || _a === void 0 ? void 0 : _a.classList.remove("hovered");
        }
        for (let name in this.draggables) {
            (_b = this.draggables[name].svgelement) === null || _b === void 0 ? void 0 : _b.classList.remove("hovered");
        }
    }
    reset_picked_class() {
        var _a;
        for (let name in this.draggables) {
            (_a = this.draggables[name].svgelement) === null || _a === void 0 ? void 0 : _a.classList.remove("picked");
        }
    }
}
class ButtonHandler {
    constructor(button_svg, diagram_svg) {
        this.button_svg = button_svg;
        this.diagram_svg = diagram_svg;
        // callbacks : {[key : string] : (state : boolean) => any} = {};
        this.states = {};
        this.svg_g_element = {};
        this.touchdownName = null;
        this.focus_padding = 1;
    }
    remove(name) {
        delete this.states[name];
        const g = this.svg_g_element[name];
        g === null || g === void 0 ? void 0 : g.remove();
        delete this.svg_g_element[name];
    }
    /** add a new toggle button if it doesn't exist, otherwise, update diagrams and callback */
    try_add_toggle(name, diagram_on, diagram_off, state, callback) {
        let g = this.svg_g_element[name];
        if (g) {
            g.innerHTML = "";
        }
        else {
            g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            this.button_svg.appendChild(g);
        }
        return this.add_toggle(name, diagram_on, diagram_off, state, g, callback);
    }
    add_toggle(name, diagram_on, diagram_off, state, g, callback) {
        let g_off = document.createElementNS("http://www.w3.org/2000/svg", "g");
        f_draw_to_svg(this.button_svg, g_off, diagram_off, true, false, calculate_text_scale(this.diagram_svg));
        g_off.setAttribute("overflow", "visible");
        g_off.style.cursor = "pointer";
        let g_on = document.createElementNS("http://www.w3.org/2000/svg", "g");
        f_draw_to_svg(this.button_svg, g_on, diagram_on, true, false, calculate_text_scale(this.diagram_svg));
        g_on.setAttribute("overflow", "visible");
        g_on.style.cursor = "pointer";
        g.setAttribute("overflow", "visible");
        g.setAttribute("tabindex", "0");
        g.appendChild(g_on);
        g.appendChild(g_off);
        this.svg_g_element[name] = g;
        this.states[name] = state;
        const set_display = (state) => {
            g_on.setAttribute("display", state ? "block" : "none");
            g_off.setAttribute("display", state ? "none" : "block");
        };
        set_display(this.states[name]);
        const update_state = (state, redraw = true) => {
            this.states[name] = state;
            callback(this.states[name], redraw);
            set_display(this.states[name]);
        };
        g.onmousedown = (e) => {
            e.preventDefault();
        };
        g.onclick = (e) => {
            e.preventDefault();
            update_state(!this.states[name]);
        };
        g.onkeydown = (e) => {
            if (e.key == "Enter")
                update_state(!this.states[name]);
        };
        const setter = (state) => { update_state(state, false); };
        return setter;
    }
    /** add a new click button if it doesn't exist, otherwise, update diagrams and callback */
    try_add_click(name, diagram, diagram_pressed, diagram_hover, callback) {
        let g = this.svg_g_element[name];
        if (g) {
            g.innerHTML = "";
        }
        else {
            g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            this.button_svg.appendChild(g);
        }
        this.add_click(name, diagram, diagram_pressed, diagram_hover, g, callback);
    }
    add_click(name, diagram, diagram_pressed, diagram_hover, g, callback) {
        let g_normal = document.createElementNS("http://www.w3.org/2000/svg", "g");
        f_draw_to_svg(this.button_svg, g_normal, diagram, true, false, calculate_text_scale(this.diagram_svg));
        g_normal.setAttribute("overflow", "visible");
        g_normal.style.cursor = "pointer";
        let g_pressed = document.createElementNS("http://www.w3.org/2000/svg", "g");
        f_draw_to_svg(this.button_svg, g_pressed, diagram_pressed, true, false, calculate_text_scale(this.diagram_svg));
        g_pressed.setAttribute("overflow", "visible");
        g_pressed.style.cursor = "pointer";
        let g_hover = document.createElementNS("http://www.w3.org/2000/svg", "g");
        f_draw_to_svg(this.button_svg, g_hover, diagram_hover, true, false, calculate_text_scale(this.diagram_svg));
        g_hover.setAttribute("overflow", "visible");
        g_hover.style.cursor = "pointer";
        g.setAttribute("class", FOCUS_NO_OUTLINE_CLASSNAME);
        g.setAttribute("overflow", "visible");
        g.setAttribute("tabindex", "0");
        g.appendChild(g_normal);
        g.appendChild(g_pressed);
        g.appendChild(g_hover);
        this.add_focus_rect(g, diagram);
        this.svg_g_element[name] = g;
        const set_display = (pressed, hovered) => {
            g_normal.setAttribute("display", !pressed && !hovered ? "block" : "none");
            g_pressed.setAttribute("display", pressed ? "block" : "none");
            g_hover.setAttribute("display", hovered && !pressed ? "block" : "none");
        };
        set_display(false, false);
        let pressed_state = false;
        let hover_state = false;
        const update_display = () => {
            set_display(pressed_state, hover_state);
        };
        g.onblur = (_e) => {
            hover_state = false;
            pressed_state = false;
            update_display();
        };
        g.onmouseenter = (_e) => {
            hover_state = true;
            update_display();
        };
        g.onmouseleave = (_e) => {
            hover_state = false;
            pressed_state = false;
            update_display();
        };
        g.onmousedown = (e) => {
            e.preventDefault();
            pressed_state = true;
            update_display();
        };
        g.onmouseup = (e) => {
            pressed_state = false;
            update_display();
        };
        g.onclick = (e) => {
            callback();
            hover_state = false;
            pressed_state = false;
            update_display();
        };
        g.onkeydown = (e) => {
            if (e.key == "Enter") {
                callback();
                pressed_state = true;
                update_display();
            }
        };
        g.onkeyup = (e) => {
            pressed_state = false;
            update_display();
        };
    }
    add_focus_rect(g, diagram) {
        const bbox = diagram.bounding_box();
        const pad = this.focus_padding;
        const width = bbox[1].x - bbox[0].x + 2 * pad;
        const height = bbox[1].y - bbox[0].y + 2 * pad;
        // focus rect svg element
        const focus_rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        focus_rect.setAttribute("width", width.toString());
        focus_rect.setAttribute("height", height.toString());
        focus_rect.setAttribute("x", (bbox[0].x - pad).toString());
        focus_rect.setAttribute("y", (-bbox[1].y - pad).toString());
        focus_rect.setAttribute("fill", "none");
        focus_rect.setAttribute("stroke", "black");
        focus_rect.setAttribute("stroke-width", "1");
        focus_rect.setAttribute("vector-effect", "non-scaling-stroke");
        focus_rect.setAttribute("class", FOCUS_RECT_CLASSNAME);
        g.appendChild(focus_rect);
    }
}

class Content {
    constructor(contentDiv) {
        this.elements = [];
        this.elementMap = new Map();
        this.nextId = 1;
        this.contentDiv = contentDiv;
    }
    generateId(type) {
        return `${type}_${this.nextId++}`;
    }
    addElement(element, type) {
        const id = this.generateId(type);
        element.id = id;
        this.elements.push(element);
        this.elementMap.set(id, element);
        element.appendTo(this.contentDiv); // Append directly here
        return id;
    }
    addHeader(text, level = 1) {
        const header = new HeaderElement(text, level);
        return this.addElement(header, "header");
    }
    addParagraph(text) {
        const paragraph = new ParagraphElement(text);
        return this.addElement(paragraph, "paragraph");
    }
    addDrawing(width = 100, height = 100) {
        const id = this.addSvg(width, height);
        const svg = this.getDrawingElement(id);
        let draw = (...diagrams) => {
            draw_to_svg(svg, diagram_combine(...diagrams));
        };
        let int = new Interactive(this.contentDiv, svg);
        return { draw, int };
    }
    addSvg(width = 100, height = 100) {
        const drawing = new DrawingElement(width, height);
        return this.addElement(drawing, "drawing");
    }
    getElement(id) {
        return this.elementMap.get(id);
    }
    getDomElement(id) {
        const element = this.elementMap.get(id);
        if (element) {
            return this.contentDiv.querySelector(`#${id}`);
        }
        return null;
    }
    getDrawingElement(drawingId) {
        const element = this.elementMap.get(drawingId);
        if (!element) {
            console.error("Svg not found");
        }
        if (element instanceof DrawingElement) {
            return this.contentDiv.querySelector(`#${drawingId}`);
        }
        return null;
    }
    removeElement(id) {
        const element = this.elementMap.get(id);
        if (element) {
            const index = this.elements.indexOf(element);
            if (index > -1) {
                this.elements.splice(index, 1);
            }
            this.elementMap.delete(id);
            const child = this.contentDiv.querySelector(`#${id}`);
            if (child) {
                this.contentDiv.removeChild(child);
            }
            return true;
        }
        return false;
    }
    toJSON() {
        return {
            elements: this.elements.map(element => (Object.assign({ id: element.id }, element.toJSON()))),
            nextId: this.nextId
        };
    }
    static fromJSON(json, div) {
        const content = new Content(div);
        content.nextId = json.nextId;
        json.elements.forEach((elementData) => {
            let element;
            switch (elementData.type) {
                case 'header':
                    element = HeaderElement.fromJSON(elementData);
                    break;
                case 'paragraph':
                    element = ParagraphElement.fromJSON(elementData);
                    break;
                case 'drawing':
                    element = DrawingElement.fromJSON(elementData);
                    break;
                default:
                    throw new Error(`Unknown element type: ${elementData.type}`);
            }
            element.id = elementData.id;
            content.elements.push(element);
            content.elementMap.set(element.id, element);
            element.appendTo(content.contentDiv); // Append during deserialization
        });
        return content;
    }
}
class HeaderElement {
    constructor(text, level) {
        this.text = text;
        this.level = level;
        this.id = '';
    }
    appendTo(container) {
        const header = document.createElement(`h${this.level}`);
        header.id = this.id;
        header.textContent = this.text;
        container.appendChild(header);
    }
    toJSON() {
        return { type: 'header', text: this.text, level: this.level };
    }
    static fromJSON(json) {
        return new HeaderElement(json.text, json.level);
    }
}
class ParagraphElement {
    constructor(text) {
        this.text = text;
        this.id = '';
    }
    appendTo(container) {
        const paragraph = document.createElement('p');
        paragraph.id = this.id;
        paragraph.textContent = this.text;
        container.appendChild(paragraph);
    }
    toJSON() {
        return { type: 'paragraph', text: this.text };
    }
    static fromJSON(json) {
        return new ParagraphElement(json.text);
    }
}
class DrawingElement {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.id = '';
    }
    appendTo(container) {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        svg.classList.add("drawing");
        svg.setAttribute("id", this.id);
        svg.setAttribute("width", `${this.width}px`);
        svg.setAttribute("height", `${this.height}px`);
        svg.style.margin = "auto";
        container.appendChild(svg);
    }
    toJSON() {
        return { type: 'drawing', width: this.width, height: this.height };
    }
    static fromJSON(json) {
        return new DrawingElement(json.width, json.height);
    }
}

/**
 * convert a function that modifies a path of a diagram to a function that modifies a diagram
 * if the diagram is a polygon or curve, the function is applied directly to the diagram
 * if the diagram is a diagram, the function is recursively applied to all children
 * if the diagram is empty or text, the function is not applied
 * @param func function that modifies a path of a diagram
*/
function function_handle_path_type(func) {
    function modified_func(d) {
        if (d.type == DiagramType.Polygon || d.type == DiagramType.Curve) {
            // apply directly
            return func(d);
        }
        else if (d.type == DiagramType.Diagram) {
            // recursively apply to all children
            d.children = d.children.map(c => modified_func(c));
            return d;
        }
        else if (d.type == DiagramType.Text || d.type == DiagramType.MultilineText) {
            // do nothing
            return d;
        }
        else {
            throw new Error("Unreachable, unknown diagram type : " + d.type);
        }
    }
    return modified_func;
}
/**
 * Resample a diagram so that it has `n` points
 * @param n number of points
 * @returns function that modifies a diagram
 */
function resample(n) {
    // TODO : this function uses Diagram.parametric_point,
    // which might be slow for large n
    // for performance reason, we might want to implement it directly by calculating
    // the points of the path here
    function func(d) {
        if (d.path == undefined)
            return d;
        let ts = (d.type == DiagramType.Curve) ? linspace(0, 1, n) : linspace_exc(0, 1, n);
        let new_points = ts.map(t => d.parametric_point(t));
        d.path = new Path(new_points);
        return d;
    }
    return function_handle_path_type(func);
}
/**
 * Subdivide each segment of a diagram into n segments
 * @param n number of segments to subdivide each segment into
 * @returns function that modifies a diagram
 */
function subdivide(n = 100) {
    function func(d) {
        if (d.path == undefined)
            return d;
        let new_points = [];
        for (let i = 0; i < d.path.points.length; i++) {
            let curr_i = i;
            let next_i = (curr_i + 1) % d.path.points.length;
            let curr_p = d.path.points[i];
            let next_p = d.path.points[next_i];
            let xs = linspace(curr_p.x, next_p.x, n + 1);
            let ys = linspace(curr_p.y, next_p.y, n + 1);
            let subdivide_points = xs.map((x, i) => V2(x, ys[i]));
            // ignore the last point
            subdivide_points.pop();
            new_points = new_points.concat(subdivide_points);
        }
        d.path = new Path(new_points);
        return d;
    }
    return function_handle_path_type(func);
}
/**
 * Get a slice of a diagram from `t_start` to `t_end`
 * @param t_start starting point of the slice
 * @param t_end ending point of the slice
 * @param n number of points in the slice
 * @returns function that modifies a diagram
 */
function slicepath(t_start, t_end, n = 100) {
    if (t_start > t_end)
        [t_start, t_end] = [t_end, t_start];
    if (t_start < 0)
        t_start = 0;
    if (t_end > 1)
        t_end = 1;
    let n_total = Math.floor(n / (t_end - t_start));
    function func(d) {
        if (d.path == undefined)
            return d;
        let dnew = d.apply(resample(n_total));
        if (dnew.path == undefined)
            return d;
        // take slice of the path
        let new_points = dnew.path.points.slice(Math.floor(t_start * n_total), Math.floor(t_end * n_total) + 1);
        dnew.path = new Path(new_points);
        return dnew;
    }
    return function_handle_path_type(func);
}
function get_round_corner_arc_points(radius, points, count) {
    let [p1, p2, p3] = points;
    let v1 = p1.sub(p2).normalize();
    let v3 = p3.sub(p2).normalize();
    let corner_angle = Math.abs((v1.angle() - v3.angle()) % Math.PI);
    let s_dist = radius / Math.tan(corner_angle / 2);
    // s_dist can only be as long as half the distance to the closest point
    let d1 = p1.sub(p2).length();
    let d3 = p3.sub(p2).length();
    // recalculate
    s_dist = Math.min(s_dist, d1 / 2, d3 / 2);
    radius = s_dist * Math.tan(corner_angle / 2);
    let pa = p2.add(v1.scale(s_dist));
    let pb = p2.add(v3.scale(s_dist));
    let distc = Math.sqrt(radius * radius + s_dist * s_dist);
    let pc = p2.add(v1.add(v3).normalize().scale(distc));
    let angle_a = pa.sub(pc).angle();
    let angle_b = pb.sub(pc).angle();
    // if we just use angle_a and angle_b as is, the arc might be drawn in the wrong direction
    // find out which direction is the correct one
    // check whether angle_a is closer to angle_b, angle_b + 2π, or angle_b - 2π
    let angle_b_plus = angle_b + 2 * Math.PI;
    let angle_b_minus = angle_b - 2 * Math.PI;
    let angle_a_b = Math.abs(angle_a - angle_b);
    let angle_a_b_plus = Math.abs(angle_a - angle_b_plus);
    let angle_a_b_minus = Math.abs(angle_a - angle_b_minus);
    if (angle_a_b_plus < angle_a_b)
        angle_b = angle_b_plus;
    if (angle_a_b_minus < angle_a_b)
        angle_b = angle_b_minus;
    let arc_points = linspace(angle_a, angle_b, count).map(a => pc.add(Vdir(a).scale(radius)));
    return arc_points;
}
/**
 * Create a function that modifies a diagram by rounding the corners of a polygon or curve
 * @param radius radius of the corner
 * @param point_indices indices of the points to be rounded
 * @returns function that modifies a diagram
 *
 * @example
 * ```javascript
 * let s = square(5).apply(mod.round_corner(2, [0,2]))
 * ```
 */
function round_corner(radius = 1, point_indices, count = 40) {
    // if radius is 0, return the identity function
    if (radius == 0)
        return (d) => d;
    // if radius is a number, create an array of length one
    if (typeof radius == "number")
        radius = [radius];
    // create a function that modify the path of a diagram, (only works for polygon and curve)
    // later we will convert it to a function that modifies any diagram using function_handle_path_type
    function func(d) {
        if (d.path == undefined)
            return d;
        let diagram_point_indices = range(0, d.path.points.length);
        if (point_indices == undefined)
            point_indices = diagram_point_indices;
        // filter only the points that are in diagram_point_indices
        point_indices = point_indices.filter(i => diagram_point_indices.includes(i));
        // repeat the radius array to match the number of points
        radius = array_repeat(radius, point_indices.length);
        let new_points = [];
        for (let i = 0; i < d.path.points.length; i++) {
            let curr_i = i;
            if (!point_indices.includes(curr_i)) {
                new_points.push(d.path.points[i]);
                continue;
            }
            let prev_i = (curr_i - 1 + d.path.points.length) % d.path.points.length;
            let next_i = (curr_i + 1) % d.path.points.length;
            let prev_p = d.path.points[prev_i];
            let curr_p = d.path.points[i];
            let next_p = d.path.points[next_i];
            let arc_points = get_round_corner_arc_points(radius[point_indices.indexOf(curr_i)], [prev_p, curr_p, next_p], count);
            new_points = new_points.concat(arc_points);
        }
        d.path = new Path(new_points);
        return d;
    }
    return function_handle_path_type(func);
}
/**
 * Add an arrow to the end of a curve
 * Make sure the diagram this modifier is applied to is a curve
 * @param headsize size of the arrow head
 * @param flip flip the arrow position
 */
function add_arrow(headsize, flip = false) {
    function func(c) {
        if (c.path == undefined)
            return c;
        let p1 = flip ? c.path.points[0] : c.path.points[c.path.points.length - 1];
        let p0 = flip ? c.path.points[1] : c.path.points[c.path.points.length - 2];
        let arrow = arrow1(p0, p1, headsize);
        return diagram_combine(c, arrow).clone_style_from(c);
    }
    return function_handle_path_type(func);
}
function arrowhead_angle(d) {
    var _a;
    if (!d.contain_tag(TAG.ARROW_HEAD))
        return NaN;
    let points = (_a = d.path) === null || _a === void 0 ? void 0 : _a.points;
    if (points == undefined)
        return NaN;
    if (points.length != 3)
        return NaN;
    let v_tip = points[0];
    let v_base1 = points[1];
    let v_base2 = points[2];
    let v_base = v_base1.add(v_base2).scale(0.5);
    let v_dir = v_tip.sub(v_base);
    return v_dir.angle();
}
/**
* Replace arrowhead inside a diagram with another diagram
* @param new_arrowhead diagram to replace the arrowhead with
* The arrow will be rotated automatically,
* The default direction is to the right (+x) with the tip at the origin
*/
function arrowhead_replace(new_arrowhead) {
    return function func(d) {
        return d.apply_to_tagged_recursive(TAG.ARROW_HEAD, (arrowhead) => {
            let angle = arrowhead_angle(arrowhead);
            return new_arrowhead.copy().rotate(angle).position(arrowhead.origin);
        });
    };
}

var modifier = /*#__PURE__*/Object.freeze({
    __proto__: null,
    add_arrow: add_arrow,
    arrowhead_replace: arrowhead_replace,
    resample: resample,
    round_corner: round_corner,
    slicepath: slicepath,
    subdivide: subdivide
});

//
// polybool - Boolean operations on polygons (union, intersection, etc)
// by Sean Connelly (@velipso), https://sean.fun
// Project Home: https://github.com/velipso/polybool
// SPDX-License-Identifier: 0BSD
//
var AlongIntersection;
(function (AlongIntersection) {
    AlongIntersection[AlongIntersection["BeforeStart"] = 0] = "BeforeStart";
    AlongIntersection[AlongIntersection["EqualStart"] = 1] = "EqualStart";
    AlongIntersection[AlongIntersection["BetweenStartAndEnd"] = 2] = "BetweenStartAndEnd";
    AlongIntersection[AlongIntersection["EqualEnd"] = 3] = "EqualEnd";
    AlongIntersection[AlongIntersection["AfterEnd"] = 4] = "AfterEnd";
})(AlongIntersection || (AlongIntersection = {}));
class Geometry {
    pointsSame(p1, p2) {
        return this.pointsSameX(p1, p2) && this.pointsSameY(p1, p2);
    }
    pointsCompare(p1, p2) {
        // returns -1 if p1 is smaller, 1 if p2 is smaller, 0 if equal
        if (this.pointsSameX(p1, p2)) {
            return this.pointsSameY(p1, p2) ? 0 : p1[1] < p2[1] ? -1 : 1;
        }
        return p1[0] < p2[0] ? -1 : 1;
    }
}
class GeometryEpsilon extends Geometry {
    constructor(epsilon = 0.0000000001) {
        super();
        this.epsilon = epsilon;
    }
    pointAboveOrOnLine(p, left, right) {
        const Ax = left[0];
        const Ay = left[1];
        const Bx = right[0];
        const By = right[1];
        const Cx = p[0];
        const Cy = p[1];
        return (Bx - Ax) * (Cy - Ay) - (By - Ay) * (Cx - Ax) >= -this.epsilon;
    }
    pointBetween(p, left, right) {
        // p must be collinear with left->right
        // returns false if p == left, p == right, or left == right
        const d_py_ly = p[1] - left[1];
        const d_rx_lx = right[0] - left[0];
        const d_px_lx = p[0] - left[0];
        const d_ry_ly = right[1] - left[1];
        const dot = d_px_lx * d_rx_lx + d_py_ly * d_ry_ly;
        // if `dot` is 0, then `p` == `left` or `left` == `right` (reject)
        // if `dot` is less than 0, then `p` is to the left of `left` (reject)
        if (dot < this.epsilon) {
            return false;
        }
        const sqlen = d_rx_lx * d_rx_lx + d_ry_ly * d_ry_ly;
        // if `dot` > `sqlen`, then `p` is to the right of `right` (reject)
        // therefore, if `dot - sqlen` is greater than 0, then `p` is to the right
        // of `right` (reject)
        if (dot - sqlen > -this.epsilon) {
            return false;
        }
        return true;
    }
    pointsSameX(p1, p2) {
        return Math.abs(p1[0] - p2[0]) < this.epsilon;
    }
    pointsSameY(p1, p2) {
        return Math.abs(p1[1] - p2[1]) < this.epsilon;
    }
    pointsCollinear(p1, p2, p3) {
        // does pt1->pt2->pt3 make a straight line?
        // essentially this is just checking to see if
        //   slope(pt1->pt2) === slope(pt2->pt3)
        // if slopes are equal, then they must be collinear, because they share pt2
        const dx1 = p1[0] - p2[0];
        const dy1 = p1[1] - p2[1];
        const dx2 = p2[0] - p3[0];
        const dy2 = p2[1] - p3[1];
        return Math.abs(dx1 * dy2 - dx2 * dy1) < this.epsilon;
    }
    linesIntersect(aStart, aEnd, bStart, bEnd) {
        // returns null if the lines are coincident (e.g., parallel or on top of
        // each other)
        //
        // returns an object if the lines intersect:
        //   {
        //     p: [x, y],    where the intersection point is at
        //     alongA: where intersection point is along A,
        //     alongB: where intersection point is along B
        //   }
        //
        // alongA and alongB will each be one of AlongIntersection, depending on
        // where the intersection point is along the A and B lines
        //
        const adx = aEnd[0] - aStart[0];
        const ady = aEnd[1] - aStart[1];
        const bdx = bEnd[0] - bStart[0];
        const bdy = bEnd[1] - bStart[1];
        const axb = adx * bdy - ady * bdx;
        if (Math.abs(axb) < this.epsilon) {
            return null; // lines are coincident
        }
        const dx = aStart[0] - bStart[0];
        const dy = aStart[1] - bStart[1];
        const A = (bdx * dy - bdy * dx) / axb;
        const B = (adx * dy - ady * dx) / axb;
        // categorizes where along the line the intersection point is at
        const categorize = (v) => v <= -this.epsilon
            ? AlongIntersection.BeforeStart
            : v < this.epsilon
                ? AlongIntersection.EqualStart
                : v - 1 <= -this.epsilon
                    ? AlongIntersection.BetweenStartAndEnd
                    : v - 1 < this.epsilon
                        ? AlongIntersection.EqualEnd
                        : AlongIntersection.AfterEnd;
        const p = [aStart[0] + A * adx, aStart[1] + A * ady];
        return {
            alongA: categorize(A),
            alongB: categorize(B),
            p,
        };
    }
}

//
// polybool - Boolean operations on polygons (union, intersection, etc)
// by Sean Connelly (@velipso), https://sean.fun
// Project Home: https://github.com/velipso/polybool
// SPDX-License-Identifier: 0BSD
//
class List {
    constructor() {
        this.nodes = [];
    }
    remove(node) {
        const i = this.nodes.indexOf(node);
        if (i >= 0) {
            this.nodes.splice(i, 1);
        }
    }
    getIndex(node) {
        return this.nodes.indexOf(node);
    }
    isEmpty() {
        return this.nodes.length <= 0;
    }
    getHead() {
        return this.nodes[0];
    }
    removeHead() {
        this.nodes.shift();
    }
    insertBefore(node, check) {
        this.findTransition(node, check).insert(node);
    }
    findTransition(node, check) {
        var _a, _b;
        // bisect to find the transition point
        const compare = (a, b) => check(b) - check(a);
        let i = 0;
        let high = this.nodes.length;
        while (i < high) {
            const mid = (i + high) >> 1;
            if (compare(this.nodes[mid], node) > 0) {
                high = mid;
            }
            else {
                i = mid + 1;
            }
        }
        return {
            before: i <= 0 ? null : (_a = this.nodes[i - 1]) !== null && _a !== void 0 ? _a : null,
            after: (_b = this.nodes[i]) !== null && _b !== void 0 ? _b : null,
            insert: (node) => {
                this.nodes.splice(i, 0, node);
                return node;
            },
        };
    }
}

//
// polybool - Boolean operations on polygons (union, intersection, etc)
// by Sean Connelly (@velipso), https://sean.fun
// Project Home: https://github.com/velipso/polybool
// SPDX-License-Identifier: 0BSD
//
class Segment {
    constructor(start, end, copyMyFill, log) {
        var _a;
        this.otherFill = null;
        this.id = (_a = log === null || log === void 0 ? void 0 : log.segmentId()) !== null && _a !== void 0 ? _a : -1;
        this.start = start;
        this.end = end;
        this.myFill = {
            above: copyMyFill ? copyMyFill.myFill.above : null,
            below: copyMyFill ? copyMyFill.myFill.below : null,
        };
    }
}
class Event {
    constructor(isStart, p, seg, primary) {
        this.status = null;
        this.isStart = isStart;
        this.p = p;
        this.seg = seg;
        this.primary = primary;
    }
}
class Intersecter {
    constructor(selfIntersection, geo, log = null) {
        this.events = new List();
        this.status = new List();
        this.selfIntersection = selfIntersection;
        this.geo = geo;
        this.log = log;
    }
    compareEvents(p1_isStart, p1_1, p1_2, p2_isStart, p2_1, p2_2) {
        // compare the selected points first
        const comp = this.geo.pointsCompare(p1_1, p2_1);
        if (comp !== 0) {
            return comp;
        }
        // the selected points are the same
        if (this.geo.pointsSame(p1_2, p2_2)) {
            // if the non-selected points are the same too...
            return 0; // then the segments are equal
        }
        if (p1_isStart !== p2_isStart) {
            // if one is a start and the other isn't...
            return p1_isStart ? 1 : -1; // favor the one that isn't the start
        }
        // otherwise, we'll have to calculate which one is below the other manually
        return this.geo.pointAboveOrOnLine(p1_2, p2_isStart ? p2_1 : p2_2, // order matters
        p2_isStart ? p2_2 : p2_1)
            ? 1
            : -1;
    }
    addEvent(ev) {
        this.events.insertBefore(ev, (here) => {
            if (here === ev) {
                return 0;
            }
            return this.compareEvents(ev.isStart, ev.p, ev.other.p, here.isStart, here.p, here.other.p);
        });
    }
    divideEvent(ev, p) {
        var _a;
        const ns = new Segment(p, ev.seg.end, ev.seg, this.log);
        // slides an end backwards
        //   (start)------------(end)    to:
        //   (start)---(end)
        (_a = this.log) === null || _a === void 0 ? void 0 : _a.segmentChop(ev.seg, p);
        this.events.remove(ev.other);
        ev.seg.end = p;
        ev.other.p = p;
        this.addEvent(ev.other);
        return this.addSegment(ns, ev.primary);
    }
    newSegment(p1, p2) {
        const forward = this.geo.pointsCompare(p1, p2);
        if (forward === 0) {
            // points are equal, so we have a zero-length segment
            return null; // skip it
        }
        return forward < 0
            ? new Segment(p1, p2, null, this.log)
            : new Segment(p2, p1, null, this.log);
    }
    addSegment(seg, primary) {
        const evStart = new Event(true, seg.start, seg, primary);
        const evEnd = new Event(false, seg.end, seg, primary);
        evStart.other = evEnd;
        evEnd.other = evStart;
        this.addEvent(evStart);
        this.addEvent(evEnd);
        return evStart;
    }
    addRegion(region) {
        // regions are a list of points:
        //  [ [0, 0], [100, 0], [50, 100] ]
        // you can add multiple regions before running calculate
        let pt1;
        let pt2 = region[region.length - 1];
        for (let i = 0; i < region.length; i++) {
            pt1 = pt2;
            pt2 = region[i];
            const seg = this.newSegment(pt1, pt2);
            if (seg) {
                this.addSegment(seg, true);
            }
        }
    }
    compareStatus(ev1, ev2) {
        const a1 = ev1.seg.start;
        const a2 = ev1.seg.end;
        const b1 = ev2.seg.start;
        const b2 = ev2.seg.end;
        if (this.geo.pointsCollinear(a1, b1, b2)) {
            if (this.geo.pointsCollinear(a2, b1, b2)) {
                return 1;
            }
            return this.geo.pointAboveOrOnLine(a2, b1, b2) ? 1 : -1;
        }
        return this.geo.pointAboveOrOnLine(a1, b1, b2) ? 1 : -1;
    }
    statusFindSurrounding(ev) {
        return this.status.findTransition(ev, (here) => {
            if (here === ev) {
                return 0;
            }
            return -this.compareStatus(ev, here);
        });
    }
    checkIntersection(ev1, ev2) {
        var _a;
        // returns the segment equal to ev1, or null if nothing equal
        const seg1 = ev1.seg;
        const seg2 = ev2.seg;
        const a1 = seg1.start;
        const a2 = seg1.end;
        const b1 = seg2.start;
        const b2 = seg2.end;
        (_a = this.log) === null || _a === void 0 ? void 0 : _a.checkIntersection(seg1, seg2);
        const i = this.geo.linesIntersect(a1, a2, b1, b2);
        if (i === null) {
            // segments are parallel or coincident
            // if points aren't collinear, then the segments are parallel, so no
            // intersections
            if (!this.geo.pointsCollinear(a1, a2, b1)) {
                return null;
            }
            // otherwise, segments are on top of each other somehow (aka coincident)
            if (this.geo.pointsSame(a1, b2) || this.geo.pointsSame(a2, b1)) {
                return null; // segments touch at endpoints... no intersection
            }
            const a1_equ_b1 = this.geo.pointsSame(a1, b1);
            const a2_equ_b2 = this.geo.pointsSame(a2, b2);
            if (a1_equ_b1 && a2_equ_b2) {
                return ev2; // segments are exactly equal
            }
            const a1_between = !a1_equ_b1 && this.geo.pointBetween(a1, b1, b2);
            const a2_between = !a2_equ_b2 && this.geo.pointBetween(a2, b1, b2);
            if (a1_equ_b1) {
                if (a2_between) {
                    //  (a1)---(a2)
                    //  (b1)----------(b2)
                    this.divideEvent(ev2, a2);
                }
                else {
                    //  (a1)----------(a2)
                    //  (b1)---(b2)
                    this.divideEvent(ev1, b2);
                }
                return ev2;
            }
            else if (a1_between) {
                if (!a2_equ_b2) {
                    // make a2 equal to b2
                    if (a2_between) {
                        //         (a1)---(a2)
                        //  (b1)-----------------(b2)
                        this.divideEvent(ev2, a2);
                    }
                    else {
                        //         (a1)----------(a2)
                        //  (b1)----------(b2)
                        this.divideEvent(ev1, b2);
                    }
                }
                //         (a1)---(a2)
                //  (b1)----------(b2)
                this.divideEvent(ev2, a1);
            }
        }
        else {
            // otherwise, lines intersect at i.p, which may or may not be between the
            // endpoints
            // is A divided between its endpoints? (exclusive)
            if (i.alongA === AlongIntersection.BetweenStartAndEnd) {
                if (i.alongB === AlongIntersection.EqualStart) {
                    this.divideEvent(ev1, b1);
                }
                else if (i.alongB === AlongIntersection.BetweenStartAndEnd) {
                    this.divideEvent(ev1, i.p);
                }
                else if (i.alongB === AlongIntersection.EqualEnd) {
                    this.divideEvent(ev1, b2);
                }
            }
            // is B divided between its endpoints? (exclusive)
            if (i.alongB === AlongIntersection.BetweenStartAndEnd) {
                if (i.alongA === AlongIntersection.EqualStart) {
                    this.divideEvent(ev2, a1);
                }
                else if (i.alongA === AlongIntersection.BetweenStartAndEnd) {
                    this.divideEvent(ev2, i.p);
                }
                else if (i.alongA === AlongIntersection.EqualEnd) {
                    this.divideEvent(ev2, a2);
                }
            }
        }
        return null;
    }
    calculate(primaryPolyInverted, secondaryPolyInverted) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const segments = [];
        while (!this.events.isEmpty()) {
            const ev = this.events.getHead();
            (_a = this.log) === null || _a === void 0 ? void 0 : _a.vert(ev.p[0]);
            if (ev.isStart) {
                (_b = this.log) === null || _b === void 0 ? void 0 : _b.segmentNew(ev.seg, ev.primary);
                const surrounding = this.statusFindSurrounding(ev);
                const above = surrounding.before;
                const below = surrounding.after;
                (_c = this.log) === null || _c === void 0 ? void 0 : _c.tempStatus(ev.seg, above ? above.seg : false, below ? below.seg : false);
                const checkBothIntersections = () => {
                    if (above) {
                        const eve = this.checkIntersection(ev, above);
                        if (eve) {
                            return eve;
                        }
                    }
                    if (below) {
                        return this.checkIntersection(ev, below);
                    }
                    return null;
                };
                const eve = checkBothIntersections();
                if (eve) {
                    // ev and eve are equal
                    // we'll keep eve and throw away ev
                    // merge ev.seg's fill information into eve.seg
                    if (this.selfIntersection) {
                        let toggle; // are we a toggling edge?
                        if (ev.seg.myFill.below === null) {
                            toggle = true;
                        }
                        else {
                            toggle = ev.seg.myFill.above !== ev.seg.myFill.below;
                        }
                        // merge two segments that belong to the same polygon
                        // think of this as sandwiching two segments together, where
                        // `eve.seg` is the bottom -- this will cause the above fill flag to
                        // toggle
                        if (toggle) {
                            eve.seg.myFill.above = !eve.seg.myFill.above;
                        }
                    }
                    else {
                        // merge two segments that belong to different polygons
                        // each segment has distinct knowledge, so no special logic is
                        // needed
                        // note that this can only happen once per segment in this phase,
                        // because we are guaranteed that all self-intersections are gone
                        eve.seg.otherFill = ev.seg.myFill;
                    }
                    (_d = this.log) === null || _d === void 0 ? void 0 : _d.segmentUpdate(eve.seg);
                    this.events.remove(ev.other);
                    this.events.remove(ev);
                }
                if (this.events.getHead() !== ev) {
                    // something was inserted before us in the event queue, so loop back
                    // around and process it before continuing
                    (_e = this.log) === null || _e === void 0 ? void 0 : _e.rewind(ev.seg);
                    continue;
                }
                //
                // calculate fill flags
                //
                if (this.selfIntersection) {
                    let toggle; // are we a toggling edge?
                    if (ev.seg.myFill.below === null) {
                        // if we are a new segment...
                        // then we toggle
                        toggle = true;
                    }
                    else {
                        // we are a segment that has previous knowledge from a division
                        // calculate toggle
                        toggle = ev.seg.myFill.above !== ev.seg.myFill.below;
                    }
                    // next, calculate whether we are filled below us
                    if (!below) {
                        // if nothing is below us...
                        // we are filled below us if the polygon is inverted
                        ev.seg.myFill.below = primaryPolyInverted;
                    }
                    else {
                        // otherwise, we know the answer -- it's the same if whatever is
                        // below us is filled above it
                        ev.seg.myFill.below = below.seg.myFill.above;
                    }
                    // since now we know if we're filled below us, we can calculate
                    // whether we're filled above us by applying toggle to whatever is
                    // below us
                    if (toggle) {
                        ev.seg.myFill.above = !ev.seg.myFill.below;
                    }
                    else {
                        ev.seg.myFill.above = ev.seg.myFill.below;
                    }
                }
                else {
                    // now we fill in any missing transition information, since we are
                    // all-knowing at this point
                    if (ev.seg.otherFill === null) {
                        // if we don't have other information, then we need to figure out if
                        // we're inside the other polygon
                        let inside;
                        if (!below) {
                            // if nothing is below us, then we're inside if the other polygon
                            // is inverted
                            inside = ev.primary ? secondaryPolyInverted : primaryPolyInverted;
                        }
                        else {
                            // otherwise, something is below us
                            // so copy the below segment's other polygon's above
                            if (ev.primary === below.primary) {
                                if (below.seg.otherFill === null) {
                                    throw new Error("otherFill is null");
                                }
                                inside = below.seg.otherFill.above;
                            }
                            else {
                                inside = below.seg.myFill.above;
                            }
                        }
                        ev.seg.otherFill = {
                            above: inside,
                            below: inside,
                        };
                    }
                }
                (_f = this.log) === null || _f === void 0 ? void 0 : _f.status(ev.seg, above ? above.seg : false, below ? below.seg : false);
                // insert the status and remember it for later removal
                ev.other.status = surrounding.insert(ev);
            }
            else {
                // end
                const st = ev.status;
                if (st === null) {
                    throw new Error("PolyBool: Zero-length segment detected; your epsilon is " +
                        "probably too small or too large");
                }
                // removing the status will create two new adjacent edges, so we'll need
                // to check for those
                const i = this.status.getIndex(st);
                if (i > 0 && i < this.status.nodes.length - 1) {
                    const before = this.status.nodes[i - 1];
                    const after = this.status.nodes[i + 1];
                    this.checkIntersection(before, after);
                }
                (_g = this.log) === null || _g === void 0 ? void 0 : _g.statusRemove(st.seg);
                // remove the status
                this.status.remove(st);
                // if we've reached this point, we've calculated everything there is to
                // know, so save the segment for reporting
                if (!ev.primary) {
                    // make sure `seg.myFill` actually points to the primary polygon
                    // though
                    if (!ev.seg.otherFill) {
                        throw new Error("otherFill is null");
                    }
                    const s = ev.seg.myFill;
                    ev.seg.myFill = ev.seg.otherFill;
                    ev.seg.otherFill = s;
                }
                segments.push(ev.seg);
            }
            // remove the event and continue
            this.events.removeHead();
        }
        (_h = this.log) === null || _h === void 0 ? void 0 : _h.done();
        return segments;
    }
}

//
// polybool - Boolean operations on polygons (union, intersection, etc)
// by Sean Connelly (@velipso), https://sean.fun
// Project Home: https://github.com/velipso/polybool
// SPDX-License-Identifier: 0BSD
//
//
// filter a list of segments based on boolean operations
//
function select(segments, selection, log) {
    const result = [];
    for (const seg of segments) {
        const index = (seg.myFill.above ? 8 : 0) +
            (seg.myFill.below ? 4 : 0) +
            (seg.otherFill && seg.otherFill.above ? 2 : 0) +
            (seg.otherFill && seg.otherFill.below ? 1 : 0);
        if (selection[index] !== 0) {
            // copy the segment to the results, while also calculating the fill status
            const keep = new Segment(seg.start, seg.end, null, log);
            keep.myFill.above = selection[index] === 1; // 1 if filled above
            keep.myFill.below = selection[index] === 2; // 2 if filled below
            result.push(keep);
        }
    }
    log === null || log === void 0 ? void 0 : log.selected(result);
    return result;
}
class SegmentSelector {
    static union(segments, log) {
        // primary | secondary
        // above1 below1 above2 below2    Keep?               Value
        //    0      0      0      0   =>   no                  0
        //    0      0      0      1   =>   yes filled below    2
        //    0      0      1      0   =>   yes filled above    1
        //    0      0      1      1   =>   no                  0
        //    0      1      0      0   =>   yes filled below    2
        //    0      1      0      1   =>   yes filled below    2
        //    0      1      1      0   =>   no                  0
        //    0      1      1      1   =>   no                  0
        //    1      0      0      0   =>   yes filled above    1
        //    1      0      0      1   =>   no                  0
        //    1      0      1      0   =>   yes filled above    1
        //    1      0      1      1   =>   no                  0
        //    1      1      0      0   =>   no                  0
        //    1      1      0      1   =>   no                  0
        //    1      1      1      0   =>   no                  0
        //    1      1      1      1   =>   no                  0
        return select(segments, [0, 2, 1, 0, 2, 2, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0], log);
    }
    static intersect(segments, log) {
        // primary & secondary
        // above1 below1 above2 below2    Keep?               Value
        //    0      0      0      0   =>   no                  0
        //    0      0      0      1   =>   no                  0
        //    0      0      1      0   =>   no                  0
        //    0      0      1      1   =>   no                  0
        //    0      1      0      0   =>   no                  0
        //    0      1      0      1   =>   yes filled below    2
        //    0      1      1      0   =>   no                  0
        //    0      1      1      1   =>   yes filled below    2
        //    1      0      0      0   =>   no                  0
        //    1      0      0      1   =>   no                  0
        //    1      0      1      0   =>   yes filled above    1
        //    1      0      1      1   =>   yes filled above    1
        //    1      1      0      0   =>   no                  0
        //    1      1      0      1   =>   yes filled below    2
        //    1      1      1      0   =>   yes filled above    1
        //    1      1      1      1   =>   no                  0
        return select(segments, [0, 0, 0, 0, 0, 2, 0, 2, 0, 0, 1, 1, 0, 2, 1, 0], log);
    }
    static difference(segments, log) {
        // primary - secondary
        // above1 below1 above2 below2    Keep?               Value
        //    0      0      0      0   =>   no                  0
        //    0      0      0      1   =>   no                  0
        //    0      0      1      0   =>   no                  0
        //    0      0      1      1   =>   no                  0
        //    0      1      0      0   =>   yes filled below    2
        //    0      1      0      1   =>   no                  0
        //    0      1      1      0   =>   yes filled below    2
        //    0      1      1      1   =>   no                  0
        //    1      0      0      0   =>   yes filled above    1
        //    1      0      0      1   =>   yes filled above    1
        //    1      0      1      0   =>   no                  0
        //    1      0      1      1   =>   no                  0
        //    1      1      0      0   =>   no                  0
        //    1      1      0      1   =>   yes filled above    1
        //    1      1      1      0   =>   yes filled below    2
        //    1      1      1      1   =>   no                  0
        return select(segments, [0, 0, 0, 0, 2, 0, 2, 0, 1, 1, 0, 0, 0, 1, 2, 0], log);
    }
    static differenceRev(segments, log) {
        // secondary - primary
        // above1 below1 above2 below2    Keep?               Value
        //    0      0      0      0   =>   no                  0
        //    0      0      0      1   =>   yes filled below    2
        //    0      0      1      0   =>   yes filled above    1
        //    0      0      1      1   =>   no                  0
        //    0      1      0      0   =>   no                  0
        //    0      1      0      1   =>   no                  0
        //    0      1      1      0   =>   yes filled above    1
        //    0      1      1      1   =>   yes filled above    1
        //    1      0      0      0   =>   no                  0
        //    1      0      0      1   =>   yes filled below    2
        //    1      0      1      0   =>   no                  0
        //    1      0      1      1   =>   yes filled below    2
        //    1      1      0      0   =>   no                  0
        //    1      1      0      1   =>   no                  0
        //    1      1      1      0   =>   no                  0
        //    1      1      1      1   =>   no                  0
        return select(segments, [0, 2, 1, 0, 0, 0, 1, 1, 0, 2, 0, 2, 0, 0, 0, 0], log);
    }
    static xor(segments, log) {
        // primary ^ secondary
        // above1 below1 above2 below2    Keep?               Value
        //    0      0      0      0   =>   no                  0
        //    0      0      0      1   =>   yes filled below    2
        //    0      0      1      0   =>   yes filled above    1
        //    0      0      1      1   =>   no                  0
        //    0      1      0      0   =>   yes filled below    2
        //    0      1      0      1   =>   no                  0
        //    0      1      1      0   =>   no                  0
        //    0      1      1      1   =>   yes filled above    1
        //    1      0      0      0   =>   yes filled above    1
        //    1      0      0      1   =>   no                  0
        //    1      0      1      0   =>   no                  0
        //    1      0      1      1   =>   yes filled below    2
        //    1      1      0      0   =>   no                  0
        //    1      1      0      1   =>   yes filled above    1
        //    1      1      1      0   =>   yes filled below    2
        //    1      1      1      1   =>   no                  0
        return select(segments, [0, 2, 1, 0, 2, 0, 0, 1, 1, 0, 0, 2, 0, 1, 2, 0], log);
    }
}

//
// polybool - Boolean operations on polygons (union, intersection, etc)
// by Sean Connelly (@velipso), https://sean.fun
// Project Home: https://github.com/velipso/polybool
// SPDX-License-Identifier: 0BSD
//
//
// converts a list of segments into a list of regions, while also removing
// unnecessary verticies
//
function SegmentChainer(segments, geo, log) {
    const chains = [];
    const regions = [];
    for (const seg of segments) {
        const pt1 = seg.start;
        const pt2 = seg.end;
        if (geo.pointsSame(pt1, pt2)) {
            console.warn("PolyBool: Warning: Zero-length segment detected; your epsilon is " +
                "probably too small or too large");
            continue;
        }
        log === null || log === void 0 ? void 0 : log.chainStart(seg);
        // search for two chains that this segment matches
        const first_match = {
            index: 0,
            matches_head: false,
            matches_pt1: false,
        };
        const second_match = {
            index: 0,
            matches_head: false,
            matches_pt1: false,
        };
        let next_match = first_match;
        function setMatch(index, matches_head, matches_pt1) {
            // return true if we've matched twice
            if (next_match) {
                next_match.index = index;
                next_match.matches_head = matches_head;
                next_match.matches_pt1 = matches_pt1;
            }
            if (next_match === first_match) {
                next_match = second_match;
                return false;
            }
            next_match = null;
            return true; // we've matched twice, we're done here
        }
        for (let i = 0; i < chains.length; i++) {
            const chain = chains[i];
            const head = chain[0];
            const tail = chain[chain.length - 1];
            if (geo.pointsSame(head, pt1)) {
                if (setMatch(i, true, true)) {
                    break;
                }
            }
            else if (geo.pointsSame(head, pt2)) {
                if (setMatch(i, true, false)) {
                    break;
                }
            }
            else if (geo.pointsSame(tail, pt1)) {
                if (setMatch(i, false, true)) {
                    break;
                }
            }
            else if (geo.pointsSame(tail, pt2)) {
                if (setMatch(i, false, false)) {
                    break;
                }
            }
        }
        if (next_match === first_match) {
            // we didn't match anything, so create a new chain
            chains.push([pt1, pt2]);
            log === null || log === void 0 ? void 0 : log.chainNew(pt1, pt2);
            continue;
        }
        if (next_match === second_match) {
            // we matched a single chain
            log === null || log === void 0 ? void 0 : log.chainMatch(first_match.index);
            // add the other point to the apporpriate end, and check to see if we've closed the
            // chain into a loop
            const index = first_match.index;
            const pt = first_match.matches_pt1 ? pt2 : pt1; // if we matched pt1, then we add pt2, etc
            const addToHead = first_match.matches_head; // if we matched at head, then add to the head
            const chain = chains[index];
            let grow = addToHead ? chain[0] : chain[chain.length - 1];
            const grow2 = addToHead ? chain[1] : chain[chain.length - 2];
            const oppo = addToHead ? chain[chain.length - 1] : chain[0];
            const oppo2 = addToHead ? chain[chain.length - 2] : chain[1];
            if (geo.pointsCollinear(grow2, grow, pt)) {
                // grow isn't needed because it's directly between grow2 and pt:
                // grow2 ---grow---> pt
                if (addToHead) {
                    log === null || log === void 0 ? void 0 : log.chainRemoveHead(first_match.index, pt);
                    chain.shift();
                }
                else {
                    log === null || log === void 0 ? void 0 : log.chainRemoveTail(first_match.index, pt);
                    chain.pop();
                }
                grow = grow2; // old grow is gone... new grow is what grow2 was
            }
            if (geo.pointsSame(oppo, pt)) {
                // we're closing the loop, so remove chain from chains
                chains.splice(index, 1);
                if (geo.pointsCollinear(oppo2, oppo, grow)) {
                    // oppo isn't needed because it's directly between oppo2 and grow:
                    // oppo2 ---oppo--->grow
                    if (addToHead) {
                        log === null || log === void 0 ? void 0 : log.chainRemoveTail(first_match.index, grow);
                        chain.pop();
                    }
                    else {
                        log === null || log === void 0 ? void 0 : log.chainRemoveHead(first_match.index, grow);
                        chain.shift();
                    }
                }
                log === null || log === void 0 ? void 0 : log.chainClose(first_match.index);
                // we have a closed chain!
                regions.push(chain);
                continue;
            }
            // not closing a loop, so just add it to the apporpriate side
            if (addToHead) {
                log === null || log === void 0 ? void 0 : log.chainAddHead(first_match.index, pt);
                chain.unshift(pt);
            }
            else {
                log === null || log === void 0 ? void 0 : log.chainAddTail(first_match.index, pt);
                chain.push(pt);
            }
            continue;
        }
        // otherwise, we matched two chains, so we need to combine those chains together
        function reverseChain(index) {
            log === null || log === void 0 ? void 0 : log.chainReverse(index);
            chains[index].reverse(); // gee, that's easy
        }
        function appendChain(index1, index2) {
            // index1 gets index2 appended to it, and index2 is removed
            const chain1 = chains[index1];
            const chain2 = chains[index2];
            let tail = chain1[chain1.length - 1];
            const tail2 = chain1[chain1.length - 2];
            const head = chain2[0];
            const head2 = chain2[1];
            if (geo.pointsCollinear(tail2, tail, head)) {
                // tail isn't needed because it's directly between tail2 and head
                // tail2 ---tail---> head
                log === null || log === void 0 ? void 0 : log.chainRemoveTail(index1, tail);
                chain1.pop();
                tail = tail2; // old tail is gone... new tail is what tail2 was
            }
            if (geo.pointsCollinear(tail, head, head2)) {
                // head isn't needed because it's directly between tail and head2
                // tail ---head---> head2
                log === null || log === void 0 ? void 0 : log.chainRemoveHead(index2, head);
                chain2.shift();
            }
            log === null || log === void 0 ? void 0 : log.chainJoin(index1, index2);
            chains[index1] = chain1.concat(chain2);
            chains.splice(index2, 1);
        }
        const F = first_match.index;
        const S = second_match.index;
        log === null || log === void 0 ? void 0 : log.chainConnect(F, S);
        const reverseF = chains[F].length < chains[S].length; // reverse the shorter chain, if needed
        if (first_match.matches_head) {
            if (second_match.matches_head) {
                if (reverseF) {
                    // <<<< F <<<< --- >>>> S >>>>
                    reverseChain(F);
                    // >>>> F >>>> --- >>>> S >>>>
                    appendChain(F, S);
                }
                else {
                    // <<<< F <<<< --- >>>> S >>>>
                    reverseChain(S);
                    // <<<< F <<<< --- <<<< S <<<<   logically same as:
                    // >>>> S >>>> --- >>>> F >>>>
                    appendChain(S, F);
                }
            }
            else {
                // <<<< F <<<< --- <<<< S <<<<   logically same as:
                // >>>> S >>>> --- >>>> F >>>>
                appendChain(S, F);
            }
        }
        else {
            if (second_match.matches_head) {
                // >>>> F >>>> --- >>>> S >>>>
                appendChain(F, S);
            }
            else {
                if (reverseF) {
                    // >>>> F >>>> --- <<<< S <<<<
                    reverseChain(F);
                    // <<<< F <<<< --- <<<< S <<<<   logically same as:
                    // >>>> S >>>> --- >>>> F >>>>
                    appendChain(S, F);
                }
                else {
                    // >>>> F >>>> --- <<<< S <<<<
                    reverseChain(S);
                    // >>>> F >>>> --- >>>> S >>>>
                    appendChain(F, S);
                }
            }
        }
    }
    return regions;
}

//
// polybool - Boolean operations on polygons (union, intersection, etc)
// by Sean Connelly (@velipso), https://sean.fun
// Project Home: https://github.com/velipso/polybool
// SPDX-License-Identifier: 0BSD
//
class BuildLog {
    constructor() {
        this.list = [];
        this.nextSegmentId = 0;
        this.curVert = NaN;
    }
    push(type, data) {
        this.list.push({
            type,
            data: JSON.parse(JSON.stringify(data)),
        });
    }
    segmentId() {
        return this.nextSegmentId++;
    }
    checkIntersection(seg1, seg2) {
        this.push("check", { seg1, seg2 });
    }
    segmentChop(seg, p) {
        this.push("div_seg", { seg, p });
        this.push("chop", { seg, p });
    }
    statusRemove(seg) {
        this.push("pop_seg", { seg });
    }
    segmentUpdate(seg) {
        this.push("seg_update", { seg });
    }
    segmentNew(seg, primary) {
        this.push("new_seg", { seg, primary });
    }
    tempStatus(seg, above, below) {
        this.push("temp_status", { seg, above, below });
    }
    rewind(seg) {
        this.push("rewind", { seg });
    }
    status(seg, above, below) {
        this.push("status", { seg, above, below });
    }
    vert(x) {
        if (x !== this.curVert) {
            this.push("vert", { x });
            this.curVert = x;
        }
    }
    selected(segs) {
        this.push("selected", { segs });
    }
    chainStart(seg) {
        this.push("chain_start", { seg });
    }
    chainRemoveHead(index, p) {
        this.push("chain_rem_head", { index, p });
    }
    chainRemoveTail(index, p) {
        this.push("chain_rem_tail", { index, p });
    }
    chainNew(p1, p2) {
        this.push("chain_new", { p1, p2 });
    }
    chainMatch(index) {
        this.push("chain_match", { index });
    }
    chainClose(index) {
        this.push("chain_close", { index });
    }
    chainAddHead(index, p) {
        this.push("chain_add_head", { index, p });
    }
    chainAddTail(index, p) {
        this.push("chain_add_tail", { index, p });
    }
    chainConnect(index1, index2) {
        this.push("chain_con", { index1, index2 });
    }
    chainReverse(index) {
        this.push("chain_rev", { index });
    }
    chainJoin(index1, index2) {
        this.push("chain_join", { index1, index2 });
    }
    done() {
        this.push("done", null);
    }
}

//
// polybool - Boolean operations on polygons (union, intersection, etc)
// by Sean Connelly (@velipso), https://sean.fun
// Project Home: https://github.com/velipso/polybool
// SPDX-License-Identifier: 0BSD
//
class PolyBool {
    constructor(geo) {
        this.log = null;
        this.geo = geo;
    }
    buildLog(enable) {
        var _a;
        this.log = enable ? new BuildLog() : null;
        return (_a = this.log) === null || _a === void 0 ? void 0 : _a.list;
    }
    segments(poly) {
        const i = new Intersecter(true, this.geo, this.log);
        for (const region of poly.regions) {
            i.addRegion(region);
        }
        return {
            segments: i.calculate(poly.inverted, false),
            inverted: poly.inverted,
        };
    }
    combine(segments1, segments2) {
        const i = new Intersecter(false, this.geo, this.log);
        for (const seg of segments1.segments) {
            i.addSegment(new Segment(seg.start, seg.end, seg, this.log), true);
        }
        for (const seg of segments2.segments) {
            i.addSegment(new Segment(seg.start, seg.end, seg, this.log), false);
        }
        return {
            combined: i.calculate(segments1.inverted, segments2.inverted),
            inverted1: segments1.inverted,
            inverted2: segments2.inverted,
        };
    }
    selectUnion(combined) {
        return {
            segments: SegmentSelector.union(combined.combined, this.log),
            inverted: combined.inverted1 || combined.inverted2,
        };
    }
    selectIntersect(combined) {
        return {
            segments: SegmentSelector.intersect(combined.combined, this.log),
            inverted: combined.inverted1 && combined.inverted2,
        };
    }
    selectDifference(combined) {
        return {
            segments: SegmentSelector.difference(combined.combined, this.log),
            inverted: combined.inverted1 && !combined.inverted2,
        };
    }
    selectDifferenceRev(combined) {
        return {
            segments: SegmentSelector.differenceRev(combined.combined, this.log),
            inverted: !combined.inverted1 && combined.inverted2,
        };
    }
    selectXor(combined) {
        return {
            segments: SegmentSelector.xor(combined.combined, this.log),
            inverted: combined.inverted1 !== combined.inverted2,
        };
    }
    polygon(segments) {
        return {
            regions: SegmentChainer(segments.segments, this.geo, this.log),
            inverted: segments.inverted,
        };
    }
    // helper functions for common operations
    union(poly1, poly2) {
        const seg1 = this.segments(poly1);
        const seg2 = this.segments(poly2);
        const comb = this.combine(seg1, seg2);
        const seg3 = this.selectUnion(comb);
        return this.polygon(seg3);
    }
    intersect(poly1, poly2) {
        const seg1 = this.segments(poly1);
        const seg2 = this.segments(poly2);
        const comb = this.combine(seg1, seg2);
        const seg3 = this.selectIntersect(comb);
        return this.polygon(seg3);
    }
    difference(poly1, poly2) {
        const seg1 = this.segments(poly1);
        const seg2 = this.segments(poly2);
        const comb = this.combine(seg1, seg2);
        const seg3 = this.selectDifference(comb);
        return this.polygon(seg3);
    }
    differenceRev(poly1, poly2) {
        const seg1 = this.segments(poly1);
        const seg2 = this.segments(poly2);
        const comb = this.combine(seg1, seg2);
        const seg3 = this.selectDifferenceRev(comb);
        return this.polygon(seg3);
    }
    xor(poly1, poly2) {
        const seg1 = this.segments(poly1);
        const seg2 = this.segments(poly2);
        const comb = this.combine(seg1, seg2);
        const seg3 = this.selectXor(comb);
        return this.polygon(seg3);
    }
}
const polybool = new PolyBool(new GeometryEpsilon());

function dg_to_polybool(d) {
    var _a, _b;
    const dg_points = (_b = (_a = d.path) === null || _a === void 0 ? void 0 : _a.points) !== null && _b !== void 0 ? _b : [];
    const points = dg_points.map(p => [p.x, p.y]);
    return {
        regions: [points],
        inverted: false
    };
}
function polybool_to_dg(poly) {
    const diagrams_per_region = poly.regions.map(region => {
        const dg_points = region.map(p => V2(p[0], p[1]));
        return polygon(dg_points);
    });
    if (diagrams_per_region.length < 1) {
        return empty();
    }
    else if (diagrams_per_region.length == 1) {
        return diagrams_per_region[0];
    }
    else {
        return diagram_combine(...diagrams_per_region);
    }
}
/*
 * get the union of two polygons
 * @param d1 a Polygon Diagram
 * @param d2 a Polygon Diagram
 * @tolerance the tolerance for the operation (default 1e-10)
 * @returns a Polygon that is the union of d1 and d2
*/
function union(d1, d2, tolerance) {
    const pol = tolerance ? new PolyBool(new GeometryEpsilon(tolerance)) : polybool;
    const shape1 = dg_to_polybool(d1);
    const shape2 = dg_to_polybool(d2);
    const result = pol.union(shape1, shape2);
    return polybool_to_dg(result);
}
/*
 * get the difference of two polygons (d1 - d2)
 * @param d1 a Polygon Diagram
 * @param d2 a Polygon Diagram
 * @tolerance the tolerance for the operation (default 1e-10)
 * @returns a Polygon that is the difference of d1 and d2
*/
function difference(d1, d2, tolerance) {
    const pol = tolerance ? new PolyBool(new GeometryEpsilon(tolerance)) : polybool;
    const shape1 = dg_to_polybool(d1);
    const shape2 = dg_to_polybool(d2);
    const result = pol.difference(shape1, shape2);
    return polybool_to_dg(result);
}
/*
 * get the intersection of two polygons
 * @param d1 a Polygon Diagram
 * @param d2 a Polygon Diagram
 * @param tolerance the tolerance for the operation (default 1e-10)
 * @returns a Polygon that is the intersection of d1 and d2
*/
function intersect$1(d1, d2, tolerance) {
    const pol = tolerance ? new PolyBool(new GeometryEpsilon(tolerance)) : polybool;
    const shape1 = dg_to_polybool(d1);
    const shape2 = dg_to_polybool(d2);
    const result = pol.intersect(shape1, shape2);
    return polybool_to_dg(result);
}
/*
 * get the xor of two polygons
 * @param d1 a Polygon Diagram
 * @param d2 a Polygon Diagram
 * @param tolerance the tolerance for the operation (default 1e-10)
 * @returns a Polygon that is the xor of d1 and d2
*/
function xor(d1, d2, tolerance) {
    const pol = tolerance ? new PolyBool(new GeometryEpsilon(tolerance)) : polybool;
    const shape1 = dg_to_polybool(d1);
    const shape2 = dg_to_polybool(d2);
    const result = pol.xor(shape1, shape2);
    return polybool_to_dg(result);
}

var boolean = /*#__PURE__*/Object.freeze({
    __proto__: null,
    difference: difference,
    intersect: intersect$1,
    union: union,
    xor: xor
});

var string_filter;
(function (string_filter) {
    function outer_shadow(dx, dy, radius, stdev, color, id = 'outer-shadow', width, height, scale_factor = 1) {
        const x = (width - 1) / 2;
        const y = (height - 1) / 2;
        return `
        <filter id="${id}" x="-${x * 100}%" y="-${y * 100}%" width="${width * 100}%" height="${height * 100}%">
            <feMorphology operator="dilate" radius="${radius * scale_factor}" in="SourceAlpha" result="dilated" />
            <feGaussianBlur in="dilated" stdDeviation="${stdev * scale_factor}" />
            <feOffset dx="${dx * scale_factor}" dy="${dy * scale_factor}" result="offsetblur" />
            <feFlood flood-color="${color}" result="colorblur"/>
            <feComposite in="colorblur" in2="offsetblur" operator="in" result="shadow" />
            <feComposite in="shadow" in2="SourceAlpha" operator="out" result="clipped-shadow"/>
        </filter>
        `;
    }
    string_filter.outer_shadow = outer_shadow;
})(string_filter || (string_filter = {}));

var filter = /*#__PURE__*/Object.freeze({
    __proto__: null,
    get string_filter () { return string_filter; }
});

let default_axes_options = {
    // bbox   : [V2(-100,-100), V2(100,100)],
    bbox: undefined,
    xrange: [-2, 2],
    yrange: [-2, 2],
    xticks: undefined,
    yticks: undefined,
    n_sample: 100,
    ticksize: 0.1,
    headsize: 0.05,
    tick_label_offset: 0,
};
function axes_transform(axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    if (opt.bbox == undefined) {
        // get values from xrange and yrange
        let [xmin, xmax] = opt.xrange;
        let [ymin, ymax] = opt.yrange;
        opt.bbox = [V2(xmin, ymin), V2(xmax, ymax)];
    }
    let [lowerleft, upperright] = opt.bbox;
    let [xmin, xmax] = opt.xrange;
    let [ymin, ymax] = opt.yrange;
    return function (v) {
        let x = lowerleft.x + (v.x - xmin) / (xmax - xmin) * (upperright.x - lowerleft.x);
        let y = lowerleft.y + (v.y - ymin) / (ymax - ymin) * (upperright.y - lowerleft.y);
        return V2(x, y);
    };
}
let ax = axes_transform;
/**
 * Draw xy axes without ticks
 * @param axes_options options for the axes
 * example: opt = {
 *    bbox   : [V2(-100,-100), V2(100,100)],
 * }
 * @returns a Diagram object
 */
function axes_empty(axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    if (opt.bbox == undefined) {
        // get values from xrange and yrange
        let [xmin, xmax] = opt.xrange;
        let [ymin, ymax] = opt.yrange;
        opt.bbox = [V2(xmin, ymin), V2(xmax, ymax)];
    }
    let [lowerleft, upperright] = opt.bbox;
    // get the intersection point
    let xorigin = lowerleft.x + (upperright.x - lowerleft.x) / (opt.xrange[1] - opt.xrange[0]) * (0 - opt.xrange[0]);
    let yorigin = lowerleft.y + (upperright.y - lowerleft.y) / (opt.yrange[1] - opt.yrange[0]) * (0 - opt.yrange[0]);
    let xaxis = arrow2$1(V2(lowerleft.x, yorigin), V2(upperright.x, yorigin), opt.headsize).append_tags(TAG.GRAPH_AXIS);
    let yaxis = arrow2$1(V2(xorigin, lowerleft.y), V2(xorigin, upperright.y), opt.headsize).append_tags(TAG.GRAPH_AXIS);
    return diagram_combine(xaxis, yaxis).stroke('gray').fill('gray');
    // return xaxis;
}
/**
 * Draw xy corner axes without ticks
 * @param axes_options options for the axes
 * example: opt = {
 *    bbox   : [V2(-100,-100), V2(100,100)],
 * }
 * @returns a Diagram object
 */
function axes_corner_empty(axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    if (opt.bbox == undefined) {
        // get values from xrange and yrange
        let [xmin, xmax] = opt.xrange;
        let [ymin, ymax] = opt.yrange;
        opt.bbox = [V2(xmin, ymin), V2(xmax, ymax)];
    }
    let [lowerleft, upperright] = opt.bbox;
    // get the intersection point
    let xaxis = arrow1(lowerleft, V2(upperright.x, lowerleft.y), opt.headsize).append_tags(TAG.GRAPH_AXIS);
    let yaxis = arrow1(lowerleft, V2(lowerleft.x, upperright.y), opt.headsize).append_tags(TAG.GRAPH_AXIS);
    return diagram_combine(xaxis, yaxis).stroke('gray').fill('gray');
    // return xaxis;
}
/**
 * Draw xy corner axes without ticks and with break mark in x axis
 * @param axes_options options for the axes
 */
function axes_corner_empty_xbreak(axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    if (opt.bbox == undefined) {
        // get values from xrange and yrange
        let [xmin, xmax] = opt.xrange;
        let [ymin, ymax] = opt.yrange;
        opt.bbox = [V2(xmin, ymin), V2(xmax, ymax)];
    }
    let [lowerleft, upperright] = opt.bbox;
    // get the intersection point
    let xbreak_ysize_ = opt.ticksize * 2;
    if (opt.xticks == undefined) {
        opt.xticks = get_tick_numbers(opt.xrange[0], opt.xrange[1], false);
        opt.xticks = opt.xticks.filter(x => x > opt.xrange[0] && x < opt.xrange[1]);
    }
    let xbreak_xsize = (opt.xticks[1] - opt.xticks[0]) / 2;
    let xbreak_xpos = opt.xticks[0] - xbreak_xsize;
    let trans_f = axes_transform(opt);
    // suffix _ means in the transformed coordinate
    let xbreak_pleft_ = trans_f(V2(xbreak_xpos - xbreak_xsize / 2, 0));
    let xbreak_pright_ = trans_f(V2(xbreak_xpos + xbreak_xsize / 2, 0));
    let xbreak_xsize_ = xbreak_pright_.x - xbreak_pleft_.x;
    let xbreak_pbottom_ = xbreak_pleft_.add(V2(xbreak_xsize_ * 1 / 3, -xbreak_ysize_ / 2));
    let xbreak_ptop_ = xbreak_pleft_.add(V2(xbreak_xsize_ * 2 / 3, xbreak_ysize_ / 2));
    let xbreak_curve = curve([xbreak_pleft_, xbreak_pbottom_, xbreak_ptop_, xbreak_pright_]);
    let xaxis_left = line$1(lowerleft, xbreak_pleft_);
    let xaxis_right = arrow1(xbreak_pright_, V2(upperright.x, lowerleft.y), opt.headsize);
    let xaxis = diagram_combine(xaxis_left, xbreak_curve, xaxis_right).append_tags(TAG.GRAPH_AXIS);
    let yaxis = arrow1(lowerleft, V2(lowerleft.x, upperright.y), opt.headsize).append_tags(TAG.GRAPH_AXIS);
    return diagram_combine(xaxis, yaxis).stroke('gray').fill('gray');
}
/**
 * Create a single tick mark in the x axis
 * @param x x coordinate of the tick mark
 * @param y y coordinate of the tick mark
 * @param height height of the tick mark
 */
function xtickmark_empty(x, y, axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    let height = opt.ticksize;
    let pos = axes_transform(opt)(V2(x, y));
    return line$1(V2(pos.x, pos.y + height / 2), V2(pos.x, pos.y - height / 2))
        .stroke('gray').append_tags(TAG.GRAPH_TICK);
}
function xtickmark(x, y, str, axes_options) {
    let tick = xtickmark_empty(x, y, axes_options);
    let label = textvar(str).move_origin_text("top-center").translate(tick.get_anchor("bottom-center"))
        .translate(V2(0, -((axes_options === null || axes_options === void 0 ? void 0 : axes_options.tick_label_offset) || 0)))
        .textfill('gray').append_tags(TAG.GRAPH_TICK_LABEL);
    return diagram_combine(tick, label);
}
/**
 * Create a single tick mark in the y axis
 * @param y y coordinate of the tick mark
 * @param x x coordinate of the tick mark
 * @param height height of the tick mark
 */
function ytickmark_empty(y, x, axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    let height = opt.ticksize;
    let pos = axes_transform(opt)(V2(x, y));
    return line$1(V2(pos.x + height / 2, pos.y), V2(pos.x - height / 2, pos.y))
        .stroke('gray').append_tags(TAG.GRAPH_TICK);
}
function ytickmark(y, x, str, axes_options) {
    let tick = ytickmark_empty(y, x, axes_options);
    let label = textvar(str).move_origin_text("center-right").translate(tick.get_anchor("center-left"))
        .translate(V2(-((axes_options === null || axes_options === void 0 ? void 0 : axes_options.tick_label_offset) || 0), 0))
        .textfill('gray').append_tags(TAG.GRAPH_TICK_LABEL);
    return diagram_combine(tick, label);
}
// ======= BEGIN utility to calculate ticks
/// TODO: find a smarter way to calculate this
function tweak_interval(interval) {
    if (0.1 < interval && interval < 2)
        return 1;
    return interval;
}
function get_tick_interval(min, max) {
    let range = max - min;
    let range_order = Math.floor(Math.log10(range));
    let interval_to_try = [0.1, 0.15, 0.2, 0.5, 1.0].map(x => x * Math.pow(10, range_order));
    let tick_counts = interval_to_try.map(x => Math.floor(range / x));
    // choose the interval so that the number of ticks is between the biggest one but less than 10
    for (let i = 0; i < tick_counts.length; i++) {
        if (tick_counts[i] <= 10) {
            return tweak_interval(interval_to_try[i]);
        }
    }
    return tweak_interval(interval_to_try.slice(-1)[0]);
}
function get_tick_numbers_range(min, max) {
    let interval = get_tick_interval(min, max);
    // round min and max to the nearest interval
    let new_min = Math.round(min / interval) * interval;
    let new_max = Math.round(max / interval) * interval;
    let new_count = Math.round((new_max - new_min) / interval);
    let l = range_inc(0, new_count).map(x => new_min + x * interval);
    // round l to the nearest interval
    let interval_prec = -Math.floor(Math.log10(interval) - 1);
    if (interval_prec >= 0)
        l = l.map(x => parseFloat(x.toFixed(interval_prec)));
    return l;
}
function get_tick_numbers_aroundzero(neg, pos, nozero = true) {
    if (neg > 0)
        throw new Error('neg must be negative');
    if (pos < 0)
        throw new Error('pos must be positive');
    let magnitude = Math.max(-neg, pos);
    let interval = get_tick_interval(-magnitude, magnitude);
    // round min and max to the nearest interval
    let new_min = Math.ceil(neg / interval) * interval;
    let new_max = Math.floor(pos / interval) * interval;
    let new_count = Math.floor((new_max - new_min) / interval);
    let l = linspace(new_min, new_max, new_count + 1);
    // round l to the nearest interval
    let interval_prec = -Math.floor(Math.log10(interval));
    if (interval_prec >= 0)
        l = l.map(x => parseFloat(x.toFixed(interval_prec)));
    if (nozero) {
        return l.filter(x => x != 0);
    }
    else {
        return l;
    }
}
function get_tick_numbers(min, max, exclude_zero = true) {
    if (exclude_zero && min < 0 && max > 0) {
        return get_tick_numbers_aroundzero(min, max);
    }
    else {
        return get_tick_numbers_range(min, max);
    }
}
// ======= END utility to calculate ticks
function xticks(axes_options, y = 0, empty = false) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    if (opt.xticks == undefined) {
        opt.xticks = get_tick_numbers(opt.xrange[0], opt.xrange[1], y == 0);
    }
    // remove ticks outside of the range
    // opt.xticks = opt.xticks.filter(x => x >= opt.xrange[0] && x <= opt.xrange[1]);
    opt.xticks = opt.xticks.filter(x => x > opt.xrange[0] && x < opt.xrange[1]);
    let xticks_diagrams = empty ?
        opt.xticks.map(x => xtickmark_empty(x, y, opt)) :
        opt.xticks.map(x => xtickmark(x, y, x.toString(), opt));
    return diagram_combine(...xticks_diagrams);
}
function yticks(axes_options, x = 0, empty = false) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    if (opt.yticks == undefined) {
        opt.yticks = get_tick_numbers(opt.yrange[0], opt.yrange[1], x == 0);
    }
    // remove ticks outside of the range
    // opt.yticks = opt.yticks.filter(y => y >= opt.yrange[0] && y <= opt.yrange[1]);
    opt.yticks = opt.yticks.filter(y => y > opt.yrange[0] && y < opt.yrange[1]);
    let yticks_diagrams = empty ?
        opt.yticks.map(y => ytickmark_empty(y, x, opt)) :
        opt.yticks.map(y => ytickmark(y, x, y.toString(), opt));
    return diagram_combine(...yticks_diagrams);
}
/**
 * Draw xy corner axes with ticks
 * @param axes_options options for the axes
 */
function xycorneraxes(axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    let xmin = opt.xrange[0];
    let ymin = opt.yrange[0];
    return diagram_combine(axes_corner_empty(opt), xticks(opt, ymin), yticks(opt, xmin));
}
/**
 * Draw xy corner axes with ticks and break mark in x axis
 * @param axes_options options for the axes
 */
function xycorneraxes_xbreak(axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    let xmin = opt.xrange[0];
    let ymin = opt.yrange[0];
    return diagram_combine(axes_corner_empty_xbreak(opt), xticks(opt, ymin), yticks(opt, xmin));
}
/**
 * Draw xy axes with ticks
 * @param axes_options options for the axes
 */
function xyaxes(axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    return diagram_combine(axes_empty(opt), xticks(opt), yticks(opt));
}
/**
 * Draw x axis with ticks
 * @param axes_options options for the axis
 */
function xaxis(axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    if (opt.bbox == undefined) {
        // get values from xrange and yrange
        let [xmin, xmax] = opt.xrange;
        let [ymin, ymax] = opt.yrange;
        opt.bbox = [V2(xmin, ymin), V2(xmax, ymax)];
    }
    let ax_origin = axes_transform(opt)(V2(0, 0));
    let xaxis = arrow2$1(V2(opt.bbox[0].x, ax_origin.y), V2(opt.bbox[1].x, ax_origin.y), opt.headsize)
        .append_tags(TAG.GRAPH_AXIS);
    let xtickmarks = xticks(opt, 0);
    return diagram_combine(xaxis, xtickmarks);
}
/**
 * Draw y axis with ticks
 * @param axes_options options for the axis
 */
function yaxis(axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    if (opt.bbox == undefined) {
        // get values from xrange and yrange
        let [xmin, xmax] = opt.xrange;
        let [ymin, ymax] = opt.yrange;
        opt.bbox = [V2(xmin, ymin), V2(xmax, ymax)];
    }
    let ax_origin = axes_transform(opt)(V2(0, 0));
    let yaxis = arrow2$1(V2(ax_origin.x, opt.bbox[0].y), V2(ax_origin.x, opt.bbox[1].y), opt.headsize)
        .append_tags(TAG.GRAPH_AXIS);
    let ytickmarks = yticks(opt, 0);
    return diagram_combine(yaxis, ytickmarks);
}
function ygrid(axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    if (opt.xticks == undefined) {
        opt.xticks = get_tick_numbers(opt.xrange[0], opt.xrange[1], false);
    }
    let ygrid_diagrams = opt.xticks.map(x => line$1(V2(x, opt.yrange[0]), V2(x, opt.yrange[1])).transform(axes_transform(opt)).stroke('gray'));
    return diagram_combine(...ygrid_diagrams).append_tags(TAG.GRAPH_GRID);
}
function xgrid(axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    if (opt.yticks == undefined) {
        opt.yticks = get_tick_numbers(opt.yrange[0], opt.yrange[1], false);
    }
    let xgrid_diagrams = opt.yticks.map(y => line$1(V2(opt.xrange[0], y), V2(opt.xrange[1], y)).transform(axes_transform(opt)).stroke('gray'));
    return diagram_combine(...xgrid_diagrams).append_tags(TAG.GRAPH_GRID);
}
//  TODO: add xticks and ytiks as argument
function xygrid(axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    if (opt.xticks == undefined) {
        opt.xticks = get_tick_numbers(opt.xrange[0], opt.xrange[1], false);
    }
    if (opt.yticks == undefined) {
        opt.yticks = get_tick_numbers(opt.yrange[0], opt.yrange[1], false);
    }
    let xgrid_diagrams = opt.xticks.map(x => line$1(V2(x, opt.yrange[0]), V2(x, opt.yrange[1])).transform(axes_transform(opt)).stroke('gray'));
    let ygrid_diagrams = opt.yticks.map(y => line$1(V2(opt.xrange[0], y), V2(opt.xrange[1], y)).transform(axes_transform(opt)).stroke('gray'));
    return diagram_combine(...xgrid_diagrams, ...ygrid_diagrams);
}
// TODO : 
// export function axes(axes_options? : Partial<axes_options>) : Diagram {
//     let opt = {...default_axes_options, ...axes_options}; // use default if not defined
// }
/**
 * Plot a curve given a list of points
 * @param data list of points
 * @param axes_options options for the axes
 * example: opt = {
 *  bbox   : [V2(-100,-100), V2(100,100)],
 *  xrange : [-2, 2],
 *  yrange : [-2, 2],
 * }
 */
function plotv(data, axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    let [xmin, xmax] = opt.xrange;
    let [ymin, ymax] = opt.yrange;
    // split data into segments that are within the range
    let segments = [];
    let current_segment = [];
    for (let i = 0; i < data.length; i++) {
        let p = data[i];
        let is_inside = (p.x >= xmin && p.x <= xmax && p.y >= ymin && p.y <= ymax);
        if (!is_inside) {
            if (current_segment.length > 1)
                segments.push(current_segment);
            current_segment = [];
        }
        else {
            current_segment.push(p);
        }
    }
    if (current_segment.length > 1)
        segments.push(current_segment);
    let d;
    // create separate paths for each segment
    let path_diagrams = segments.map(segment => curve(segment));
    if (path_diagrams.length == 1) {
        d = path_diagrams[0];
    }
    else {
        d = diagram_combine(...path_diagrams).stroke('black').fill('none');
    }
    return d.transform(axes_transform(opt));
}
/**
 * Plot a curve given xdata and ydata
 * @param xdata x coordinates of the data
 * @param ydata y coordinates of the data
 * @param axes_options options for the axes
 * example: opt = {
 *   bbox   : [V2(-100,-100), V2(100,100)],
 *   xrange : [-2, 2],
 *   yrange : [-2, 2],
 * }
 */
function plot$1(xdata, ydata, axes_options) {
    if (xdata.length != ydata.length)
        throw new Error('xdata and ydata must have the same length');
    let vdata = xdata.map((x, i) => V2(x, ydata[i]));
    return plotv(vdata, axes_options);
}
/**
 * Plot a function
 * @param f function to plot
 * @param n number of points to plot
 * @param axes_options options for the axes
 */
function plotf(f, axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    let xdata = linspace(...opt.xrange, opt.n_sample);
    let vdata = xdata.map(x => V2(x, f(x)));
    return plotv(vdata, axes_options);
}
function under_curvef(f, x_start, x_end, axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    let new_opt = Object.assign({}, opt); // copy opt
    new_opt.xrange = [x_start, x_end];
    new_opt.bbox = undefined;
    // draw plot from x_start to x_end
    let fplot = plotf(f, new_opt);
    let area_under = fplot.add_points([V2(x_end, 0), V2(x_start, 0)]).to_polygon();
    return area_under.transform(axes_transform(opt));
}

var shapes_graph = /*#__PURE__*/Object.freeze({
    __proto__: null,
    ax: ax,
    axes_corner_empty: axes_corner_empty,
    axes_corner_empty_xbreak: axes_corner_empty_xbreak,
    axes_empty: axes_empty,
    axes_transform: axes_transform,
    default_axes_options: default_axes_options,
    get_tick_numbers: get_tick_numbers,
    plot: plot$1,
    plotf: plotf,
    plotv: plotv,
    under_curvef: under_curvef,
    xaxis: xaxis,
    xgrid: xgrid,
    xtickmark: xtickmark,
    xtickmark_empty: xtickmark_empty,
    xticks: xticks,
    xyaxes: xyaxes,
    xycorneraxes: xycorneraxes,
    xycorneraxes_xbreak: xycorneraxes_xbreak,
    xygrid: xygrid,
    yaxis: yaxis,
    ygrid: ygrid,
    ytickmark: ytickmark,
    ytickmark_empty: ytickmark_empty,
    yticks: yticks
});

/**
 * Create an annotation vector
 * @param v vector to be annotated
 * @param str string to be annotated (will be converted to mathematical italic)
 * if you don't want to convert to mathematical italic, use annotation.vector_text
 * @param arrow_head_size size of the arrow head
 * @param text_offset position offset of the text
 */
function vector(v, str, text_offset, arrow_head_size) {
    if (text_offset == undefined) {
        text_offset = V2(0, 0);
    } // default value
    let vec = arrow(v, arrow_head_size);
    if (str == "" || str == undefined) {
        return vec;
    } // if str is empty, return only the vector
    let txt = textvar(str).position(v.add(text_offset));
    return diagram_combine(vec, txt);
}
/**
 * Create an annotation for angle
 * @param p three points to define the angle
 * @param str string to be annotated (will be converted to mathematical italic)
 * @param radius radius of the arc
 * @param text_offset position offset of the text
 * if given as a number, the text will be placed at the angle bisector with the given distance from the vertex
 * if given as a vector, the text will be placed at the given position offset
 */
function angle(p, str, radius = 1, text_offset) {
    let [p1, p2, p3] = p;
    let va = p1.sub(p2);
    let vb = p3.sub(p2);
    if (text_offset == undefined) {
        text_offset = V2(0, 0);
    } // default value
    if (typeof text_offset == "number") {
        let vd = va.normalize().add(vb.normalize()).normalize().scale(text_offset);
        text_offset = vd;
    }
    let angle_a = va.angle();
    let angle_b = vb.angle();
    // angle_b must be larger than angle_a
    if (angle_b < angle_a) {
        angle_b += 2 * Math.PI;
    }
    let angle_arc = arc(radius, angle_b - angle_a).rotate(angle_a)
        .add_points([V2(0, 0)]).to_polygon();
    if (str == "" || str == undefined) {
        return angle_arc.position(p2);
    } // if str is empty, return only the arc
    let angle_text = textvar(str)
        .translate(text_offset);
    return diagram_combine(angle_arc, angle_text).position(p2);
}
/**
 * Create an annotation for angle (always be the smaller angle)
 * @param p three points to define the angle
 * @param str string to be annotated (will be converted to mathematical italic)
 * @param radius radius of the arc
 * @param text_offset position offset of the text
 * if given as a number, the text will be placed at the angle bisector with the given distance from the vertex
 * if given as a vector, the text will be placed at the given position offset
 */
function angle_smaller(p, str, radius = 1, text_offset) {
    let [p1, p2, p3] = p;
    let va = p1.sub(p2);
    let vb = p3.sub(p2);
    let angle_a = va.angle();
    let angle_b = vb.angle();
    // angle_b must be larger than angle_a
    if (angle_b < angle_a) {
        angle_b += 2 * Math.PI;
    }
    let dangle = angle_b - angle_a;
    // if dangle is larger than 180 degree, swap the two vectors
    let ps = dangle > Math.PI ? [p3, p2, p1] : [p1, p2, p3];
    return angle(ps, str, radius, text_offset);
}
/**
 * Create an annotation for right angle
 * make sure the angle is 90 degree
 * @param p three points to define the angle
 * @param size size of the square
 */
function right_angle(p, size = 1) {
    let [p1, p2, p3] = p;
    let p1_ = p1.sub(p2).normalize().scale(size).add(p2);
    let p3_ = p3.sub(p2).normalize().scale(size).add(p2);
    let p2_ = V2(p1_.x, p3_.y);
    return curve([p1_, p2_, p3_]);
}
function length(p1, p2, str, offset, tablength, textoffset, tabsymmetric = true) {
    // setup defaults
    tablength = tablength !== null && tablength !== void 0 ? tablength : p2.sub(p1).length() / 20;
    textoffset = textoffset !== null && textoffset !== void 0 ? textoffset : offset * 2;
    let v = p1.equals(p2) ? V2(0, 0) : p2.sub(p1).normalize();
    let n = V2(v.y, -v.x);
    let pA = p1.add(n.scale(offset));
    let pB = p2.add(n.scale(offset));
    let tabA = tabsymmetric ?
        line$1(pA.sub(n.scale(tablength / 2)), pA.add(n.scale(tablength / 2))) :
        line$1(pA, pA.sub(n.scale(tablength)));
    let tabB = tabsymmetric ?
        line$1(pB.sub(n.scale(tablength / 2)), pB.add(n.scale(tablength / 2))) :
        line$1(pB, pB.sub(n.scale(tablength)));
    let lineAB = line$1(pA, pB);
    let lines = diagram_combine(lineAB, tabA, tabB);
    let pmid = p1.add(p2).scale(0.5);
    let label = textvar(str).position(pmid.add(n.scale(textoffset)));
    return diagram_combine(lines, label);
}
/**
 * Create a congruence mark
 * @param p1 start point of the line
 * @param p2 end point of the line
 * @param count number of marks
 * @param size size of the mark
 * @param gap gap between the marks
 */
function congruence_mark(p1, p2, count, size = 1, gap) {
    let v = p2.sub(p1);
    let n_angle = Math.atan2(v.x, -v.y);
    let p_mid = p1.add(p2).scale(0.5);
    gap = gap !== null && gap !== void 0 ? gap : size / 2;
    let marks = [];
    for (let i = 0; i < count; i++) {
        let l = line$1(V2(-size / 2, i * gap), V2(size / 2, i * gap));
        marks.push(l);
    }
    let dg_marks = diagram_combine(...marks);
    return dg_marks.rotate(n_angle).move_origin('center-center').position(p_mid);
}
/**
 * Create a parallel mark
 * @param p1 start point of the line
 * @param p2 end point of the line
 * @param count number of marks
 * @param size size of the mark
 * @param gap gap between the marks
 * @param arrow_angle angle of the arrow
 */
function parallel_mark(p1, p2, count, size = 1, gap, arrow_angle = 0.5) {
    let v = p2.sub(p1);
    let n_angle = Math.atan2(v.x, -v.y);
    let p_mid = p1.add(p2).scale(0.5);
    gap = gap !== null && gap !== void 0 ? gap : size / 2;
    let marks = [];
    let dy = size / 2 * Math.cos(arrow_angle);
    for (let i = 0; i < count; i++) {
        let p0 = V2(0, i * gap - dy);
        let l1 = line$1(V2(-size / 2, i * gap), p0);
        let l2 = line$1(V2(size / 2, i * gap), p0);
        marks.push(l1.combine(l2));
    }
    let dg_marks = diagram_combine(...marks);
    return dg_marks.rotate(n_angle).move_origin('center-center').position(p_mid);
}

var shapes_annotation = /*#__PURE__*/Object.freeze({
    __proto__: null,
    angle: angle,
    angle_smaller: angle_smaller,
    congruence_mark: congruence_mark,
    length: length,
    parallel_mark: parallel_mark,
    right_angle: right_angle,
    vector: vector
});

/**
 * Create an inclined plane.
 * @param length The length of the inclined plane.
 * @param angle The angle of the inclined plane.
 * @returns A diagram of the inclined plane.
 */
function inclined_plane(length, angle) {
    return polygon([V2(0, 0), V2(length, length * Math.tan(angle)), V2(length, 0)]);
}
/**
 * Create a spring between two points.
 * @param p1 The first point.
 * @param p2 The second point.
 * @param radius The radius of the spring.
 * @param coil_number The number of coils in the spring.
 * @param separation_coefficient The coefficient of separation between coils.
 * \* at 0, no coils are overlapping. (there is no max value)
 * @param sample_number The number of points to sample in the spring.
 * @returns A diagram of the spring.
 */
function spring(p1, p2, radius = 1, coil_number = 10, separation_coefficient = 0.5, sample_number = 100) {
    // I got this equation from https://www.reddit.com/r/desmos/comments/i3m3yd/interactive_spring_graphic/
    let angle = p2.sub(p1).angle();
    let length = p2.sub(p1).length();
    // abbrev
    let R = separation_coefficient;
    let n = coil_number;
    let k = radius / R; // k*R = radius
    let a = (2 * n + 1) * Math.PI;
    let b = (length - 2 * R) / a;
    let parametric_function = (t) => V2(b * t + R - R * Math.cos(t), k * R * Math.sin(t));
    let points = linspace(0, a, sample_number).map(parametric_function);
    return curve(points).rotate(angle).translate(p1);
}

var shapes_mechanics = /*#__PURE__*/Object.freeze({
    __proto__: null,
    inclined_plane: inclined_plane,
    spring: spring
});

let default_bar_options$1 = {
    gap: 0.1,
    ticksize: 0.2,
    bbox: [V2(0, 0), V2(10, 10)],
};
function to_ax_options$1(datavalues, baropt) {
    var _a, _b;
    let opt = Object.assign(Object.assign({}, default_bar_options$1), baropt); // use default if not defined
    let n = datavalues.length;
    let ymax = Math.max(...datavalues);
    let yrange = (_a = opt.yrange) !== null && _a !== void 0 ? _a : [0, ymax];
    let bbox = (_b = opt.bbox) !== null && _b !== void 0 ? _b : [V2(0, 0), V2(10, ymax)];
    let ax_opt = {
        xrange: [-1, n],
        yrange: yrange,
        headsize: 0,
        ticksize: opt.ticksize,
        bbox: bbox,
    };
    return ax_opt;
}
/**
 * Plot a bar chart
 * @param datavalues the data values to plot
 * @param bar_options options for the bar chart
 * @returns a diagram of the bar chart
 */
function plot(datavalues, bar_options = {}) {
    let opt = Object.assign(Object.assign({}, default_bar_options$1), bar_options); // use default if not defined
    let ax_opt = to_ax_options$1(datavalues, opt);
    let ax_f = axes_transform(ax_opt);
    let bar_arr = datavalues.map((y, i) => rectangle(1.0 - opt.gap, y).move_origin('bottom-center')
        .position(V2(Number(i), 0)).transform(ax_f));
    return diagram_combine(...bar_arr);
}
/**
 * x-axes with label for bar chart
 * @param datanames the data names
 * @param bar_options options for the bar chart
 * @returns a diagram of the x-axes
 */
function xaxes(datanames, bar_options = {}) {
    let opt = Object.assign(Object.assign({}, default_bar_options$1), bar_options); // use default if not defined
    let n = datanames.length;
    let ax_opt = to_ax_options$1(datanames.map(() => 1), opt);
    let ax_f = axes_transform(ax_opt);
    let l = line$1(V2(-1, 0), V2(n, 0)).transform(ax_f).stroke('gray');
    let label_arr = datanames.map((name, i) => text(name).move_origin_text('top-center').position(V2(Number(i), 0)).transform(ax_f)
        .translate(V2(0, -opt.ticksize / 2)).textfill('gray'));
    return diagram_combine(l, ...label_arr);
}
/**
 * y-axes with label for bar chart
 * @param datavalues the data values
 * @param bar_options options for the bar chart
 */
function yaxes(datavalues, bar_options = {}) {
    var _a;
    let opt = Object.assign(Object.assign({}, default_bar_options$1), bar_options); // use default if not defined
    let ax_opt = to_ax_options$1(datavalues, opt);
    let ymax = ax_opt.yrange[1];
    let yrange = (_a = opt.yrange) !== null && _a !== void 0 ? _a : [0, ymax];
    let ax_f = axes_transform(ax_opt);
    let l = line$1(V2(-1, 0), V2(-1, yrange[1])).transform(ax_f).stroke('gray');
    return yticks(ax_opt, -1).combine(l);
}
function axes_tansform(datavalues, bar_options = {}) {
    let opt = Object.assign(Object.assign({}, default_bar_options$1), bar_options); // use default if not defined
    let ax_opt = to_ax_options$1(datavalues, opt);
    return axes_transform(ax_opt);
}

var shapes_bar = /*#__PURE__*/Object.freeze({
    __proto__: null,
    axes_tansform: axes_tansform,
    default_bar_options: default_bar_options$1,
    plot: plot,
    xaxes: xaxes,
    yaxes: yaxes
});

/**
 * Draw an empty axis from xmin to xmax with arrowsize
 * @param xmin minimum value of the numberline
 * @param xmax maximum value of the numberline
 * @param arrowsize the size of the arrowhead
 * returns a Diagram
 */
function axis(xmin, xmax, arrowsize = 1) {
    return arrow2$1(V2(xmin, 0), V2(xmax, 0), arrowsize).fill('black').append_tags(TAG.GRAPH_AXIS);
}
/**
 * Draw a numbered ticks for a numberline
 * @param xs the values of the ticks
 * @param ticksize the size of the ticks
 * @param number_offset the offset of the number from the ticks
 * returns a Diagram
 */
function numbered_ticks(xs, ticksize, number_offset) {
    let d_ticks = [];
    for (let i of xs) {
        let tick = line$1(V2(i, -ticksize / 2), V2(i, ticksize / 2)).stroke('black').append_tags(TAG.GRAPH_TICK);
        let num = text(i.toString()).move_origin('top-center').position(V2(i, -ticksize / 2 - number_offset))
            .append_tags(TAG.GRAPH_TICK_LABEL);
        d_ticks.push(diagram_combine(tick, num));
    }
    return diagram_combine(...d_ticks);
}
/**
 * Draw ticks for a numberline
 * @param xs the values of the ticks
 * @param ticksize the size of the ticks
 * returns a Diagram
 */
function ticks(xs, ticksize) {
    let d_ticks = [];
    for (let i of xs) {
        let tick = line$1(V2(i, -ticksize / 2), V2(i, ticksize / 2)).stroke('black').append_tags(TAG.GRAPH_TICK);
        d_ticks.push(tick);
    }
    return diagram_combine(...d_ticks);
}
/**
 * Draw a single tick for a numberline
 * @param x the value of the tick
 * @param txt the text of the tick
 * @param ticksize the size of the tick
 * @param text_offset the offset of the text from the tick
 * returns a Diagram
 */
function single_tick(x, txt, ticksize, text_offset) {
    let tick = line$1(V2(x, -ticksize / 2), V2(x, ticksize / 2)).stroke('black').append_tags(TAG.GRAPH_TICK);
    if (txt == '')
        return tick;
    let num = text(txt).move_origin('top-center').position(V2(x, -ticksize / 2 - text_offset))
        .append_tags(TAG.GRAPH_TICK_LABEL);
    return diagram_combine(tick, num);
}

var shapes_numberline = /*#__PURE__*/Object.freeze({
    __proto__: null,
    axis: axis,
    numbered_ticks: numbered_ticks,
    single_tick: single_tick,
    ticks: ticks
});

var TableOrientation;
(function (TableOrientation) {
    TableOrientation["ROWS"] = "rows";
    TableOrientation["COLUMNS"] = "columns";
})(TableOrientation || (TableOrientation = {}));
/**
 * Create a table with diagrams inside
 * @param diagrams 2D array of diagrams
 * @param orientation orientation of the table (default: 'rows')
 * can be 'rows' or 'columns'
 * @param min_rowsize minimum size of each row
 * @param min_colsize minimum size of each column
 * @returns a diagram of the table with the diagrams inside
 */
function table(diagrams, padding = 0, orientation = TableOrientation.ROWS, min_rowsize = 0, min_colsize = 0) {
    // if the orientation is columns, then we just transpose the rows and columns
    let diagram_rows = orientation == TableOrientation.ROWS ? diagrams : transpose(diagrams);
    const pad = expand_directional_value(padding);
    function f_size(d) {
        if (d == undefined)
            return [min_colsize, min_rowsize];
        let [bottomleft, topright] = d.bounding_box();
        let width = topright.x - bottomleft.x + pad[1] + pad[3];
        let height = topright.y - bottomleft.y + pad[0] + pad[2];
        return [width, height];
    }
    let row_count = diagram_rows.length;
    let col_count = Math.max(...diagram_rows.map(row => row.length));
    let rowsizes = Array(row_count).fill(min_rowsize);
    let colsizes = Array(col_count).fill(min_colsize);
    // find the maximum size of each row and column
    for (let r = 0; r < row_count; r++) {
        for (let c = 0; c < col_count; c++) {
            let [w, h] = f_size(diagram_rows[r][c]);
            rowsizes[r] = Math.max(rowsizes[r], h);
            colsizes[c] = Math.max(colsizes[c], w);
        }
    }
    return fixed_size(diagrams, rowsizes, colsizes, orientation);
}
/**
 * WARNING: Deprecated, use tags instead
 * Style the cells of a table
 * @param table_diagram a diagram of a table
 * @param styles an array of cell styles
 * each style has an index of the cell and the style
 * e.g. { index : [0,0], fill : 'red', stroke : 'black', strokewidth : 2 }
 * not all styles are required
 * e.g. { index : [0,0], fill : 'red' }
 * @returns a new diagram with the cells styled
 */
function style_cell(table_diagram, styles) {
    let newd = table_diagram.copy();
    if (table_diagram.tags.includes(TAG.CONTAIN_TABLE)) {
        let table_index = newd.children.findIndex(d => d.tags.includes(TAG.TABLE));
        let new_table = style_cell(newd.children[table_index], styles);
        newd.children[table_index] = new_table;
        return newd;
    }
    else if (!table_diagram.tags.includes(TAG.TABLE)) {
        return table_diagram;
    }
    for (let style of styles) {
        let [r, c] = style.index;
        let cell = newd.children[r].children[c];
        if (style.fill) {
            cell = cell.fill(style.fill);
        }
        if (style.stroke) {
            cell = cell.stroke(style.stroke);
        }
        if (style.strokewidth) {
            cell = cell.strokewidth(style.strokewidth);
        }
        newd.children[r].children[c] = cell;
    }
    return newd;
}
/**
 * Create a table with fixed size
 * @param diagrams 2D array of diagrams
 * @param rowsizes size of each row
 * if `rowsizes.length` is less than `diagrams.length`, the last value will be repeated
 * e.g. [1,2,3] -> [1,2,3,3,3]
 * @param colsizes size of each column
 * if `colsizes.length` is less than `diagrams[0].length`, the last value will be repeated
 * @param orientation orientation of the table (default: 'rows')
 * can be 'rows' or 'columns'
 * @returns a diagram of the table with the diagrams inside
 */
function fixed_size(diagrams, rowsizes, colsizes, orientation = TableOrientation.ROWS) {
    // if the orientation is columns, then we just transpose the rows and columns
    let diagram_rows = orientation == TableOrientation.ROWS ? diagrams : transpose(diagrams);
    let row_count = diagram_rows.length;
    let col_count = Math.max(...diagram_rows.map(row => row.length));
    const empty_map = get_empty_map(diagrams);
    let table = empty_fixed_size(row_count, col_count, rowsizes, colsizes, empty_map);
    let points = get_points(table);
    let diagram_grid = [];
    for (let r = 0; r < row_count; r++) {
        for (let c = 0; c < col_count; c++) {
            let d = diagram_rows[r][c];
            if (d == undefined)
                continue;
            d = d.move_origin('center-center').position(points[r][c])
                .append_tags(TAG.TABLE_CONTENT)
                .append_tags(TAG.ROW_ + r)
                .append_tags(TAG.COL_ + c);
            diagram_grid.push(d);
        }
    }
    let diagram_grid_combined = diagram_combine(...diagram_grid);
    return diagram_combine(table, diagram_grid_combined).append_tags(TAG.CONTAIN_TABLE);
}
function get_empty_map(diagrams) {
    var _a;
    let row_count = diagrams.length;
    let col_count = Math.max(...diagrams.map(row => row.length));
    let empty_indices_map = Array(row_count).fill(false).map(() => Array(col_count).fill(false));
    for (let r = 0; r < row_count; r++) {
        for (let c = 0; c < col_count; c++) {
            const d = diagrams[r][c];
            if (d == undefined || ((_a = d === null || d === void 0 ? void 0 : d.is_empty) === null || _a === void 0 ? void 0 : _a.call(d)))
                empty_indices_map[r][c] = true;
        }
    }
    return empty_indices_map;
}
/**
 * Create an empty table with fixed size
 * @param row_count number of rows
 * @param col_count number of columns
 * @param rowsizes size of each row
 * if `rowsizes.length` is less than `row_count`, the last value will be repeated
 * e.g. [1,2,3] -> [1,2,3,3,3]
 * @param colsizes size of each column
 * if `colsizes.length` is less than `col_count`, the last value will be repeated
 */
function empty_fixed_size(row_count, col_count, rowsizes, colsizes, empty_map) {
    while (rowsizes.length < row_count) {
        rowsizes.push(rowsizes[rowsizes.length - 1]);
    }
    while (colsizes.length < col_count) {
        colsizes.push(colsizes[colsizes.length - 1]);
    }
    let rows = [];
    let y_top = 0;
    for (let r = 0; r < row_count; r++) {
        let y_bot = y_top - rowsizes[r];
        let x_left = 0;
        let cols = [];
        for (let c = 0; c < col_count; c++) {
            let x_right = x_left + colsizes[c];
            let x_mid = (x_left + x_right) / 2;
            let y_mid = (y_top + y_bot) / 2;
            //TODO: draw line instead of recangles
            let rect = rectangle_corner(V2(x_left, y_bot), V2(x_right, y_top)).move_origin(V2(x_mid, y_mid))
                .append_tags(TAG.TABLE_CELL)
                .append_tags(TAG.ROW_ + r)
                .append_tags(TAG.COL_ + c);
            if (empty_map[r][c])
                rect = rect.append_tags(TAG.EMPTY_CELL);
            cols.push(rect);
            x_left = x_right;
        }
        rows.push(diagram_combine(...cols));
        y_top = y_bot;
    }
    return diagram_combine(...rows).append_tags(TAG.TABLE);
}
/**
 * Get the midpoints of the cells from a table diagram
 * @param table_diagram a table diagram
 * @returns a 2D array of points
 * the first index is the row, the second index is the column
 */
function get_points(table_diagram) {
    let table_diagram_ = table_diagram;
    if (table_diagram.tags.includes(TAG.CONTAIN_TABLE)) {
        for (let d of table_diagram.children) {
            if (d.tags.includes(TAG.TABLE)) {
                table_diagram_ = d;
                break;
            }
        }
    }
    if (!table_diagram_.tags.includes(TAG.TABLE))
        return [];
    let rows = [];
    for (let row of table_diagram_.children) {
        let cols = [];
        for (let cell of row.children) {
            cols.push(cell.origin);
        }
        rows.push(cols);
    }
    return rows;
}

var shapes_table = /*#__PURE__*/Object.freeze({
    __proto__: null,
    empty_fixed_size: empty_fixed_size,
    fixed_size: fixed_size,
    get_points: get_points,
    style_cell: style_cell,
    table: table
});

let default_bar_options = {
    ticksize: 0.2,
    range: [0, 1],
    bbox: [V2(0, 0), V2(10, 10)],
    orientation: 'x',
    headsize: 0.05,
    tick_label_offset: 0,
};
function to_ax_options(baropt) {
    var _a;
    let opt = Object.assign(Object.assign({}, default_bar_options), baropt); // use default if not defined
    opt.bbox = (_a = opt.bbox) !== null && _a !== void 0 ? _a : [V2(0, 0), V2(10, 10)]; // just to make sure it is defined
    if (opt.orientation == 'x') {
        let ax_opt = {
            xrange: opt.range,
            yrange: [opt.bbox[0].y, opt.bbox[1].y],
            xticks: opt.ticks,
            headsize: opt.headsize,
            ticksize: opt.ticksize,
            bbox: opt.bbox,
            tick_label_offset: opt.tick_label_offset,
        };
        return ax_opt;
    }
    else {
        let ax_opt = {
            xrange: [opt.bbox[0].x, opt.bbox[1].x],
            yrange: opt.range,
            yticks: opt.ticks,
            headsize: opt.headsize,
            ticksize: opt.ticksize,
            bbox: opt.bbox,
            tick_label_offset: opt.tick_label_offset,
        };
        return ax_opt;
    }
}
/**
 * axis for boxplot
 * @param bar_options options for the bar chart
 * @returns a diagram of the axes
 */
function axes(bar_options = {}) {
    let opt = Object.assign(Object.assign({}, default_bar_options), bar_options); // use default if not defined
    let ax_opt = to_ax_options(opt);
    // let ax_f = axes_transform(ax_opt);
    let [lowerleft, upperright] = opt.bbox;
    if (opt.orientation == 'x') {
        let xaxis = arrow2$1(V2(lowerleft.x, 0), V2(upperright.x, 0), opt.headsize);
        let xtickmarks = xticks(ax_opt, 0);
        return diagram_combine(xaxis, xtickmarks).stroke('gray').fill('gray');
    }
    else {
        let yaxis = arrow2$1(V2(0, lowerleft.y), V2(0, upperright.y), opt.headsize);
        let ytickmarks = yticks(ax_opt, 0);
        return diagram_combine(yaxis, ytickmarks).stroke('gray').fill('gray');
    }
}
/**
 */
function empty_tickmarks(xs, bar_options = {}) {
    let opt = Object.assign(Object.assign({}, default_bar_options), bar_options); // use default if not defined
    let ax_opt = to_ax_options(opt);
    // let ax_f = axes_transform(ax_opt);
    if (opt.orientation == 'x') {
        ax_opt.xticks = xs;
        return xticks(ax_opt, 0, true);
    }
    else {
        ax_opt.yticks = xs;
        return yticks(ax_opt, 0, true);
    }
}
/**
 * Plot a boxplot from quartiles
 * @param quartiles [Q0, Q1, Q2, Q3, Q4]
 * @param pos position of the boxplot
 * @param size size of the boxplot
 * @param bar_options options for the bar chart
 * @returns a diagram of the boxplot
 */
function plotQ(quartiles, pos, size, bar_options) {
    let opt = Object.assign(Object.assign({}, default_bar_options), bar_options); // use default if not defined
    let ax_opt = to_ax_options(opt);
    let ax_f = axes_transform(ax_opt);
    let [Q0, Q1, Q2, Q3, Q4] = quartiles;
    let whisker_size = 0.8 * size;
    if (opt.orientation == 'x') {
        let box = rectangle(Q3 - Q1, size).move_origin('center-left').position(V2(Q1, pos)).transform(ax_f);
        let min = line$1(V2(Q0, pos - whisker_size / 2), V2(Q0, pos + whisker_size / 2)).transform(ax_f);
        let max = line$1(V2(Q4, pos - whisker_size / 2), V2(Q4, pos + whisker_size / 2)).transform(ax_f);
        let median = line$1(V2(Q2, pos - size / 2), V2(Q2, pos + size / 2)).transform(ax_f);
        let whisker_min = line$1(V2(Q0, pos), V2(Q1, pos)).transform(ax_f);
        let whisker_max = line$1(V2(Q3, pos), V2(Q4, pos)).transform(ax_f);
        return diagram_combine(box, min, max, median, whisker_min, whisker_max);
    }
    else {
        let box = rectangle(size, Q3 - Q1).move_origin('bottom-center').position(V2(pos, Q1)).transform(ax_f);
        let min = line$1(V2(pos - whisker_size / 2, Q0), V2(pos + whisker_size / 2, Q0)).transform(ax_f);
        let max = line$1(V2(pos - whisker_size / 2, Q4), V2(pos + whisker_size / 2, Q4)).transform(ax_f);
        let median = line$1(V2(pos - size / 2, Q2), V2(pos + size / 2, Q2)).transform(ax_f);
        let whisker_min = line$1(V2(pos, Q0), V2(pos, Q1)).transform(ax_f);
        let whisker_max = line$1(V2(pos, Q3), V2(pos, Q4)).transform(ax_f);
        return diagram_combine(box, min, max, median, whisker_min, whisker_max);
    }
}
// TODO: plot boxplot from data
// TODO: plot multiple boxplots at once

var shapes_boxplot = /*#__PURE__*/Object.freeze({
    __proto__: null,
    axes: axes,
    default_bar_options: default_bar_options,
    empty_tickmarks: empty_tickmarks,
    plotQ: plotQ,
    to_ax_options: to_ax_options
});

var GeoType;
(function (GeoType) {
    GeoType["LINE"] = "LINE";
})(GeoType || (GeoType = {}));
// TODO : CeoCircle
function intersect(o1, o2) {
    if (o1.type === GeoType.LINE && o2.type === GeoType.LINE) {
        let l1 = o1;
        let l2 = o2;
        let p = line_intersection(l1, l2);
        return [p];
    }
    return [];
}
/**
 * Get a point that is `d` distance away from `p` in the direction of `dir`
 * *ideally, point `p` should be in line `l`*
 */
function point_onLine_atDistance_from(l, d, p) {
    let dir = l.dir.normalize();
    return p.add(dir.scale(d));
}
/**
 * Get a point
 * - that is collinear with `p1` and `p2`
 * - that is `len` away from `p2` in the direction away from `p1`
 */
function point_collinear_extend_length(p1, p2, len) {
    let dir = p2.sub(p1).normalize();
    return p2.add(dir.scale(len));
}
/** Get a point that is `t` fraction of the way from `p1` to `p2` */
function point_collinear_fraction(p1, p2, t) {
    let dir = p2.sub(p1);
    return p1.add(dir.scale(t));
}
/** Get a point on line `l` with x-coordinate `x` */
function point_onLine_with_x(l, x) {
    let m = l.dir.y / l.dir.x;
    let c = l.p.y - m * l.p.x;
    return V2(x, m * x + c);
}
/** Get a point on line `l` with y-coordinate `y` */
function point_onLine_with_y(l, y) {
    let m = l.dir.y / l.dir.x;
    let c = l.p.y - m * l.p.x;
    return V2((y - c) / m, y);
}
/** Get the intersection point of two lines */
function line_intersection(l1, l2) {
    let a1 = l1.p;
    let b1 = l1.p.add(l1.dir);
    let a2 = l2.p;
    let b2 = l2.p.add(l2.dir);
    let x1 = a1.x;
    let y1 = a1.y;
    let x2 = b1.x;
    let y2 = b1.y;
    let x3 = a2.x;
    let y3 = a2.y;
    let x4 = b2.x;
    let y4 = b2.y;
    let d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    let x = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / d;
    let y = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / d;
    return V2(x, y);
}
// Constructing lines
function line(p, dir) {
    return { type: GeoType.LINE, p, dir };
}
function line_from_points(p1, p2) {
    return line(p1, p2.sub(p1));
}
function line_from_slope(p, slope) {
    return line(p, V2(1, slope));
}
function line_from_angle(p, angle) {
    return line(p, Vdir(angle));
}
/** Define a line that is parallel to `l` and passes through `p` */
function line_parallel_at_point(l, p) {
    return line(p, l.dir);
}
/** Define a line that is perpendicular to `l` and passes through `p` */
function line_perpendicular_at_point(l, p) {
    return line(p, V2(-l.dir.y, l.dir.x));
}
/** Define a line that has the direction of `l` rotated by `angle` and passes through `p` */
function line_rotated_at_point(l, angle, p) {
    return line(p, l.dir.rotate(angle));
}
function line_intersect_bbox(l, bbox) {
    let [bottom_left, top_right] = bbox;
    let bl = bottom_left;
    let tr = top_right;
    let tl = V2(bl.x, tr.y);
    let br = V2(tr.x, bl.y);
    let intersections = [
        line_intersection(l, line_from_points(tl, tr)),
        line_intersection(l, line_from_points(tr, br)),
        line_intersection(l, line_from_points(br, bl)),
        line_intersection(l, line_from_points(bl, tl)),
    ];
    const tol = 1e-6; // tolerance
    const is_inside_bbox = (p) => {
        return p.x >= bl.x - tol && p.x <= tr.x + tol && p.y >= bl.y - tol && p.y <= tr.y + tol;
    };
    let points = intersections.filter(p => is_inside_bbox(p));
    if (points.length <= 1)
        return undefined;
    return line$1(points[0], points[1]);
}
// drawing
function normalize_padding(padding) {
    let p = (typeof padding === 'number') ? [padding] : padding;
    switch (p.length) {
        case 0: return [0, 0, 0, 0];
        case 1: return [p[0], p[0], p[0], p[0]];
        case 2: return [p[0], p[1], p[0], p[1]];
        case 3: return [p[0], p[1], p[2], p[1]];
        default: return [p[0], p[1], p[2], p[3]];
    }
}
/**
 * Get a preview diagram of the context
 * @param ctx the Geo context (a dictionary of GeoObj and Vector2)
 * @param pad padding around the diagram (determine how far away from the defined point the visible diagram is)
 */
function get_preview_diagram(ctx, pad) {
    let points = [];
    let lines = [];
    let typelist = {
        [GeoType.LINE]: lines
    };
    let object_names = Object.keys(ctx);
    for (let name of object_names) {
        let obj = ctx[name];
        if (typeof (obj) === 'number') {
            continue;
        }
        else if (obj instanceof Vector2) {
            points.push({ name, p: obj });
        }
        else {
            typelist[obj.type].push({ name, obj });
        }
    }
    let minx = Math.min(...points.map(p => p.p.x));
    let maxx = Math.max(...points.map(p => p.p.x));
    let miny = Math.min(...points.map(p => p.p.y));
    let maxy = Math.max(...points.map(p => p.p.y));
    if (pad == undefined)
        pad = Math.max(maxx - minx, maxy - miny) * 0.1;
    pad = normalize_padding(pad);
    let bbox = [V2(minx - pad[0], miny - pad[1]), V2(maxx + pad[2], maxy + pad[3])];
    let dg_lines = lines.map(l => line_intersect_bbox(l.obj, bbox)).filter(d => d !== undefined);
    let r = Math.max(bbox[1].x - bbox[0].x, bbox[1].y - bbox[0].y) * 0.01 * 2 / 3;
    let dg_points = points.map(p => {
        let c = circle(r).translate(p.p).fill('black');
        let name = textvar(p.name).translate(p.p.add(V2(r * 2, r * 2))).move_origin_text('bottom-left');
        let namebg = name.copy().textfill('white').textstroke('white').textstrokewidth(10).opacity(0.7);
        return c.combine(namebg, name);
    });
    return diagram_combine(...dg_lines, ...dg_points);
}

var geo_construct = /*#__PURE__*/Object.freeze({
    __proto__: null,
    get_preview_diagram: get_preview_diagram,
    intersect: intersect,
    line: line,
    line_from_angle: line_from_angle,
    line_from_points: line_from_points,
    line_from_slope: line_from_slope,
    line_intersection: line_intersection,
    line_parallel_at_point: line_parallel_at_point,
    line_perpendicular_at_point: line_perpendicular_at_point,
    line_rotated_at_point: line_rotated_at_point,
    point_collinear_extend_length: point_collinear_extend_length,
    point_collinear_fraction: point_collinear_fraction,
    point_onLine_atDistance_from: point_onLine_atDistance_from,
    point_onLine_with_x: point_onLine_with_x,
    point_onLine_with_y: point_onLine_with_y
});

// C. Buchheim, M. J Unger, and S. Leipert. Improving Walker's algorithm to run in linear time. In Proc. Graph Drawing (GD), 2002. http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.16.8757
// article : https://llimllib.github.io/pymag-trees/
class TreeDraw {
    constructor(tree, parent, depth = 0, number = 0) {
        var _a;
        this.diagram = tree.value;
        this.size = size(this.diagram);
        this.x = -1.0;
        this.y = depth;
        this.tree = tree;
        let tree_children = (_a = tree.children) !== null && _a !== void 0 ? _a : [];
        this.children = tree_children.map((child, i) => new TreeDraw(child, this, depth + 1, i));
        this.parent = parent;
        this.thread = undefined;
        this.mod = 0;
        this.ancestor = this;
        this.change = 0;
        this.shift = 0;
        this.number = number;
    }
    left() {
        if (this.thread)
            return this.thread;
        if (this.children.length > 0)
            return this.children[0];
        return undefined;
    }
    right() {
        if (this.thread)
            return this.thread;
        if (this.children.length > 0)
            return this.children[this.children.length - 1];
        return undefined;
    }
    lsibling() {
        if (!this.parent)
            return undefined;
        if (this.number > 0)
            return this.parent.children[this.number - 1];
        return undefined;
    }
}
function calculate_tree_buchheim(tree, vertical_dist, horizontal_gap) {
    let treeDraw = new TreeDraw(tree, undefined);
    let dt = first_walk(treeDraw, horizontal_gap);
    let min = second_walk(dt, 0, 0, vertical_dist, 0);
    if (min < 0)
        third_walk(dt, -min);
    position_diagram(dt);
    return dt;
}
function position_diagram(tree) {
    tree.diagram = tree.diagram.position(V2(tree.x, tree.y));
    tree.children.forEach(position_diagram);
}
function third_walk(td, n) {
    td.x += n;
    td.children.forEach(child => third_walk(child, n));
}
function first_walk(td, horizontal_gap) {
    let self_halfwidth = td.size[0] / 2;
    if (td.children.length === 0) {
        let lbrother = td.lsibling();
        if (lbrother) {
            let lbrother_halfwidth = lbrother.size[0] / 2;
            let dist = lbrother_halfwidth + self_halfwidth + horizontal_gap;
            td.x = lbrother.x + dist;
        }
        else {
            td.x = 0;
        }
    }
    else {
        let default_ancestor = td.children[0];
        td.children.forEach(w => {
            first_walk(w, horizontal_gap);
            default_ancestor = apportion(w, default_ancestor, horizontal_gap);
        });
        execute_shifts(td);
        let midpoint = (td.children[0].x + td.children[td.children.length - 1].x) / 2;
        let lbrother = td.lsibling();
        if (lbrother) {
            let lbrother_halfwidth = lbrother.size[0] / 2;
            let dist = lbrother_halfwidth + self_halfwidth + horizontal_gap;
            td.x = lbrother.x + dist;
            td.mod = td.x - midpoint;
        }
        else {
            td.x = midpoint;
        }
    }
    return td;
}
function apportion(v, default_ancestor, horizontal_gap) {
    let w = v.lsibling();
    if (w !== undefined) {
        let lmost_sibling = (!v.parent || v.number === 0) ? undefined : v.parent.children[0];
        let vir = v;
        let vor = v;
        let vil = w;
        let vol = lmost_sibling;
        let sir = v.mod;
        let sor = v.mod;
        let sil = vil.mod;
        let sol = vol.mod;
        while ((vil === null || vil === void 0 ? void 0 : vil.right()) !== undefined && (vir === null || vir === void 0 ? void 0 : vir.left()) !== undefined) {
            vil = vil.right();
            vir = vir.left();
            vol = vol === null || vol === void 0 ? void 0 : vol.left();
            vor = vor === null || vor === void 0 ? void 0 : vor.right();
            vor.ancestor = v;
            let lhalfwidth = vil.size[0] / 2;
            let rhalfwidth = vir.size[0] / 2;
            let dist = lhalfwidth + rhalfwidth + horizontal_gap;
            let shift = (vil.x + sil) - (vir.x + sir) + dist;
            if (shift > 0) {
                let a = ancestor(vil, v, default_ancestor);
                move_subtree(a, v, shift);
                sir += shift;
                sor += shift;
            }
            sil += vil.mod;
            sir += vir.mod;
            sol += vol.mod;
            sor += vor.mod;
        }
        if (vil.right() !== undefined && vor.right() === undefined) {
            vor.thread = vil.right();
            vor.mod += sil - sor;
        }
        else {
            if ((vir === null || vir === void 0 ? void 0 : vir.left()) !== undefined && (vol === null || vol === void 0 ? void 0 : vol.left()) === undefined) {
                vol.thread = vir.left();
                vol.mod += sir - sol;
            }
            default_ancestor = v;
        }
    }
    return default_ancestor;
}
function move_subtree(wl, wr, shift) {
    let subtrees = wr.number - wl.number;
    wr.change -= shift / subtrees;
    wr.shift += shift;
    wl.change += shift / subtrees;
    wr.x += shift;
    wr.mod += shift;
}
function execute_shifts(td) {
    let shift = 0;
    let change = 0;
    for (let i = td.children.length - 1; i >= 0; i--) {
        let w = td.children[i];
        w.x += shift;
        w.mod += shift;
        change += w.change;
        shift += w.shift + change;
    }
}
function ancestor(vil, v, default_ancestor) {
    var _a;
    if ((_a = v.parent) === null || _a === void 0 ? void 0 : _a.children.includes(vil.ancestor))
        return vil.ancestor;
    return default_ancestor;
}
function second_walk(td, m, depth, vertical_dist, min) {
    td.x += m;
    td.y = -depth * vertical_dist;
    // if (min === undefined) min = v.x;
    min = Math.min(min !== null && min !== void 0 ? min : td.x, td.x);
    td.children.forEach(w => {
        min = second_walk(w, m + td.mod, depth + 1, vertical_dist, min);
    });
    return min;
}

/**
 * Create a tree diagram from a tree node
 * @param node root node of the tree
 * @param vertical_dist vertical distance between nodes
 * @param horizontal_gap horizontal gap between nodes
 * @returns tree diagram
 */
function tree(node, vertical_dist, horizontal_gap) {
    let treeDraw = calculate_tree_buchheim(node, vertical_dist, horizontal_gap);
    return diagram_from_treeDraw(treeDraw);
}
/**
 * Mirror a tree node
 * @param node root node of the tree
 * @returns mirrored tree node
 */
function mirror_treenode(node) {
    var _a;
    return { value: node.value, children: ((_a = node.children) !== null && _a !== void 0 ? _a : []).map(mirror_treenode).reverse() };
}
/**
 * Helper function to create a diagram from a treeDraw
 * @param node treeDraw node
 * @returns diagram
 */
function diagram_from_treeDraw(node) {
    let node_dg = node.diagram;
    let children_dglist = node.children.map(diagram_from_treeDraw);
    let line_diagrams = node.children.map(child_node => {
        let start = node_dg.get_anchor('bottom-center');
        let end = child_node.diagram.get_anchor('top-center');
        return line$1(start, end);
    });
    return diagram_combine(node_dg, ...line_diagrams, ...children_dglist);
}

var shapes_tree = /*#__PURE__*/Object.freeze({
    __proto__: null,
    mirror_treenode: mirror_treenode,
    tree: tree
});

/**
* Combine multiple curves into a single curve
* @param curves an array of curves
* \* you can reverse the order of the point in a curve by using the reverse() method
*/
function curve_combine(...curves) {
    const points = curves.map(c => { var _a, _b; return (_b = (_a = c.path) === null || _a === void 0 ? void 0 : _a.points) !== null && _b !== void 0 ? _b : []; }).flat();
    return curve(points);
}
function bezier_quadratic(p0, p1, p2, n_sample = 100) {
    const dt = 1 / (n_sample - 1);
    const points = Array(n_sample);
    for (let i = 0; i < n_sample; i++) {
        const t = i * dt;
        // B(t) = (1-t)^2 * P0 + 2t(1-t)P1 + t^2P2
        const a = p0.scale((1 - t) * (1 - t));
        const b = p1.scale(2 * t * (1 - t));
        const c = p2.scale(t * t);
        points[i] = a.add(b).add(c);
    }
    return curve(points);
}
function bezier_cubic(p0, p1, p2, p3, n_sample = 100) {
    const dt = 1 / (n_sample - 1);
    const points = Array(n_sample);
    for (let i = 0; i < n_sample; i++) {
        const t = i * dt;
        // B(t) = (1-t)^3 * P0 + 3t(1-t)^2P1 + 3t^2(1-t)P2 + t^3P3
        const a = p0.scale((1 - t) * (1 - t) * (1 - t));
        const b = p1.scale(3 * t * (1 - t) * (1 - t));
        const c = p2.scale(3 * t * t * (1 - t));
        const d = p3.scale(t * t * t);
        points[i] = a.add(b).add(c).add(d);
    }
    return curve(points);
}
// interpolations
/**
* Create a curve from the cubic spline interpolation of the given points
* @param points array of points to interpolate
* @param n number of points to interpolate between each pair of points (default 10)
*/
function cubic_spline(points, n = 10) {
    const interpolated_points = interpolate_cubic_spline(points, n);
    return curve(interpolated_points);
}
/**
 * Cubic spline interpolation
 * @param points array of points to interpolate
 * @param n number of points to interpolate between each pair of points (default 10)
 * @returns array of interpolated points
 */
function interpolate_cubic_spline(points, n = 10) {
    const n_points = points.length;
    let a = points.map(p => p.y);
    let b = new Array(n_points).fill(0);
    let d = new Array(n_points).fill(0);
    let h = new Array(n_points - 1);
    for (let i = 0; i < n_points - 1; i++) {
        h[i] = points[i + 1].x - points[i].x;
    }
    // Solve tridiagonal system for the c[i] coefficients (second derivatives)
    let alpha = new Array(n_points - 1).fill(0);
    let c = new Array(n_points).fill(0);
    let l = new Array(n_points).fill(1);
    let mu = new Array(n_points).fill(0);
    let z = new Array(n_points).fill(0);
    for (let i = 1; i < n_points - 1; i++) {
        alpha[i] = (3 / h[i]) * (a[i + 1] - a[i]) - (3 / h[i - 1]) * (a[i] - a[i - 1]);
    }
    for (let i = 1; i < n_points - 1; i++) {
        l[i] = 2 * (points[i + 1].x - points[i - 1].x) - h[i - 1] * mu[i - 1];
        mu[i] = h[i] / l[i];
        z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
    }
    // Back substitution
    for (let j = n_points - 2; j >= 0; j--) {
        c[j] = z[j] - mu[j] * c[j + 1];
        b[j] = (a[j + 1] - a[j]) / h[j] - h[j] * (c[j + 1] + 2 * c[j]) / 3;
        d[j] = (c[j + 1] - c[j]) / (3 * h[j]);
    }
    // Now that we have coefficients, we can construct the spline between each pair of points
    let spline_points = [];
    for (let i = 0; i < n_points - 1; i++) {
        for (let j = 0; j <= n; j++) {
            let x = points[i].x + j * (points[i + 1].x - points[i].x) / n;
            let y = a[i] + b[i] * (x - points[i].x) + c[i] * Math.pow(x - points[i].x, 2) + d[i] * Math.pow(x - points[i].x, 3);
            spline_points.push(V2(x, y));
        }
    }
    return spline_points;
}

var shapes_curves = /*#__PURE__*/Object.freeze({
    __proto__: null,
    bezier_cubic: bezier_cubic,
    bezier_quadratic: bezier_quadratic,
    cubic_spline: cubic_spline,
    curve_combine: curve_combine,
    interpolate_cubic_spline: interpolate_cubic_spline
});

function arrowHead(headsize) {
    return curve([V2(-headsize, -headsize), V2(0, 0), V2(headsize, -headsize)]).fill('none').move_origin(V2(0, 0)).append_tags(TAG.ARROW_HEAD);
}
function arrow2(size, headsize, color) {
    const arrow = arrowHead(headsize).stroke(color).strokewidth(3).translate(V2(0, size)).strokewidth(2);
    const arrowline = line$1(V2(0, size), V2(0, -size)).stroke(color).strokewidth(2).append_tags(TAG.ARROW_LINE);
    const arrowDown = arrow.position(arrowline.get_anchor('bottom-center')).reflect();
    return diagram_combine(arrow, arrowDown, arrowline).move_origin(arrowline.get_anchor('center-center'));
}
function verticalLocator(radius = 3, fill = 'white', color = "#8B5CF6", headsize = 1.2) {
    const padding = radius * 0.5;
    const bg_sq = square(radius * 2.4).fill(color).opacity(0.25).apply(round_corner(4)).stroke('none');
    const sq = square(radius * 2).fill(fill).apply(round_corner(3)).stroke('none');
    const arr = arrow2(padding, headsize, color);
    return diagram_combine(bg_sq, sq, arr);
}
function horizontalLocator(radius = 3, fill = 'white', color = "#8B5CF6", headsize = 1.2) {
    return verticalLocator(radius, fill, color, headsize).rotate(Math.PI / 2);
}
function spanLocator(radius = 3, fill = 'white', color = "#8B5CF6", headsize = 1.2) {
    const padding = radius * 0.5;
    const bg_sq = square(radius * 2.4).fill(color).opacity(0.25).apply(round_corner(4)).stroke('none');
    const sq = square(radius * 2).fill(fill).apply(round_corner(3)).stroke('none');
    const ci = circle(padding).stroke('none').fill(color);
    return diagram_combine(bg_sq, sq, ci);
}

var shapes_interactive = /*#__PURE__*/Object.freeze({
    __proto__: null,
    arrow2: arrow2,
    arrowHead: arrowHead,
    horizontalLocator: horizontalLocator,
    spanLocator: spanLocator,
    verticalLocator: verticalLocator
});

// Simple encoding/decoding utilities using btoa, atob and encodeURIComponent, decodeURIComponent
// can be used to store user code and pass it in the URL
function encode(s) {
    return btoa(encodeURIComponent(s));
}
function decode(s) {
    return decodeURIComponent(atob(s));
}

var encoding = /*#__PURE__*/Object.freeze({
    __proto__: null,
    decode: decode,
    encode: encode
});

export { Content, Diagram, Interactive, Path, TAG, V2, Vdir, Vector2, _init_default_diagram_style, _init_default_text_diagram_style, _init_default_textdata, align_horizontal, align_vertical, shapes_annotation as annotation, arc, array_repeat, arrow, arrow1, arrow2$1 as arrow2, ax, axes_corner_empty, axes_empty, axes_transform, shapes_bar as bar, boolean, shapes_boxplot as boxplot, circle, clientPos_to_svgPos, curve, shapes_curves as curves, default_diagram_style, default_text_diagram_style, default_textdata, diagram_combine, distribute_grid_row, distribute_horizontal, distribute_horizontal_and_align, distribute_variable_row, distribute_vertical, distribute_vertical_and_align, download_svg_as_png, download_svg_as_svg, draw_to_svg, draw_to_svg_element, empty, encoding, filter, geo_construct, shapes_geometry as geometry, get_SVGPos_from_event, get_tagged_svg_element, shapes_graph as graph, handle_tex_in_svg, image, shapes_interactive as interactive, line$1 as line, linspace, linspace_exc, shapes_mechanics as mechanics, modifier as mod, multiline, multiline_bb, shapes_numberline as numberline, plot$1 as plot, plotf, plotv, polygon, range, range_inc, rectangle, rectangle_corner, regular_polygon, regular_polygon_side, reset_default_styles, square, str_latex_to_unicode, str_to_mathematical_italic, shapes_table as table, text, textvar, to_degree, to_radian, transpose, shapes_tree as tree, under_curvef, utils, xaxis, xgrid, xtickmark, xtickmark_empty, xticks, xyaxes, xycorneraxes, xygrid, yaxis, ygrid, ytickmark, ytickmark_empty, yticks };
//# sourceMappingURL=diagrams.js.map
