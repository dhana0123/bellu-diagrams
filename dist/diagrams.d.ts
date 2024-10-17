/**
 *  Class for 2D Vectors
*/
declare class Vector2 {
    x: number;
    y: number;
    constructor(x: number, y: number);
    add(v: Vector2): Vector2;
    sub(v: Vector2): Vector2;
    scale(s: number): Vector2;
    mul(v: Vector2): Vector2;
    rotate(angle: number): Vector2;
    dot(v: Vector2): number;
    cross(v: Vector2): number;
    equals(v: Vector2): boolean;
    length(): number;
    length_sq(): number;
    angle(): number;
    normalize(): Vector2;
    copy(): Vector2;
    apply(f: (v: Vector2) => Vector2): Vector2;
}
/**
 * Helper function to create a Vector2
 */
declare function V2(x: number, y: number): Vector2;
/**
 * Helper function to create a Vector2 from an angle
 * @param angle angle in radians
 * @returns Vector2 with length 1
 */
declare function Vdir(angle: number): Vector2;

declare enum DiagramType {
    Polygon = "polygon",
    Curve = "curve",
    Text = "text",
    Image = "image",
    Diagram = "diagram",
    MultilineText = "multilinetext"
}
type Anchor = 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center-center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
/**
 * Make sure that every function return a new Diagram
 * Diagram is immutable to the user
 */
type DiagramStyle = {
    "stroke": string;
    "fill": string | LinearGradient;
    "opacity": string;
    "stroke-width": string;
    "stroke-linecap": string;
    "stroke-dasharray": string;
    "stroke-linejoin": string;
    "vector-effect": string;
    "filter"?: string;
};
type LinearGradient = {
    type: 'linearGradient';
    x1?: string;
    y1?: string;
    x2?: string;
    y2?: string;
    stops: Array<{
        offset: string;
        color: string;
        opacity?: number;
    }>;
};
type TextData = {
    "text": string;
    "font-family": string;
    "font-size": string;
    "font-weight": string;
    "font-style": string;
    "text-anchor": string;
    "dy": string;
    "angle": string;
    "font-scale": string;
};
type ImageData = {
    "src": string;
};
type ExtraTspanStyle = {
    "dy": string;
    "dx": string;
    "textvar": boolean;
    "tag": string;
    "baseline-shift": string;
    "font-size-scale-factor": number;
    "is-prev-word": boolean;
};
type TextSpanData = {
    "text": string;
    "style": Partial<TextData> & Partial<DiagramStyle> & Partial<ExtraTspanStyle>;
};
type MultilineTextData = {
    "content": TextSpanData[];
    "scale-factor": number;
};
/**
* Diagram Class
*
* Diagram is a tree structure
* Diagram can be a polygon, curve, text, image, or diagram
* Polygon is a closed path
* Curve is an open path
* Diagram is a tree of Diagrams
*/
declare class Diagram {
    type: DiagramType;
    children: Diagram[];
    path: Path | undefined;
    origin: Vector2;
    style: Partial<DiagramStyle>;
    textdata: Partial<TextData>;
    multilinedata: Partial<MultilineTextData>;
    imgdata: Partial<ImageData>;
    mutable: boolean;
    tags: string[];
    private _bbox_cache;
    constructor(type_: DiagramType, args?: {
        path?: Path;
        children?: Diagram[];
        textdata?: Partial<TextData>;
        imgdata?: Partial<ImageData>;
        multilinedata?: Partial<MultilineTextData>;
        tags?: string[];
    });
    /**
     * Turn the diagram into a mutable diagram
     */
    mut(): Diagram;
    mut_parent_only(): Diagram;
    /**
     * Create a copy of the diagram that is immutable
     */
    immut(): Diagram;
    private static deep_setPrototypeOf;
    /**
     * Copy the diagram
     * @return { Diagram }
     */
    copy(): Diagram;
    copy_if_not_mutable(): Diagram;
    /**
     * Append tags to the diagram
     */
    append_tags(tags: string | string[]): Diagram;
    /**
     * Remove tags from the diagram
     */
    remove_tags(tags: string | string[]): Diagram;
    /**
     * Reset all tags of the diagram
     */
    reset_tags(): Diagram;
    /**
    * Check if the diagram contains a tag
    */
    contain_tag(tag: string): boolean;
    contain_all_tags(tags: string[]): boolean;
    /**
     * Collect all children and subchildren of the diagram
     * helper function for flatten()
     */
    private collect_children;
    /**
     * Flatten the children structure of the diagram
     * so that the diagram only has one level of children
     * \* implemented for performance reason
     */
    flatten(): Diagram;
    /**
     * Apply a function to the diagram
     * @param func function to apply
     * func takes in a diagram and returns a diagram
     */
    apply(func: (d: Diagram) => Diagram): Diagram;
    /**
     * Apply a function to the diagram and all of its children recursively
     * @param func function to apply
     * func takes in a diagram and returns a diagram
     */
    apply_recursive(func: (d: Diagram) => Diagram): Diagram;
    /**
    * Apply a function to the diagram and all of its children recursively
    * The function is only applied to the diagrams that contain a specific tag
    * @param tags the tag to filter the diagrams
    * @param func function to apply
    * func takes in a diagram and returns a diagram
    */
    apply_to_tagged_recursive(tags: string | string[], func: (d: Diagram) => Diagram): Diagram;
    /**
    * Get all the diagrams that contain a specific tag
    * @param tags the tag to filter the diagrams
    * @return a list of diagrams
    */
    get_tagged_elements(tags: string | string[]): Diagram[];
    /**
     * Combine another diagram with this diagram
     * @param diagrams a diagram or a list of diagrams
     */
    combine(...diagrams: Diagram[]): Diagram;
    /**
     * Convert the diagram to a curve
     * If the diagram is a polygon, convert it to a curve
     * If the diagram is a Diagram, convert all of the children to curves
     */
    to_curve(): Diagram;
    /**
     * Convert the diagram to a polygon
     * If the diagram is a curve, convert it to a polygon
     * If the diagram is a Diagram, convert all of the children to polygons
     */
    to_polygon(): Diagram;
    /**
     * Add points to the diagram
     * if the diagram is a polygon or curve, add points to the path
     * if the diagram is a diagram, add points to the last polygon or curve child
     * @param points points to add
     */
    add_points(points: Vector2[]): Diagram;
    private update_style;
    clone_style_from(diagram: Diagram): Diagram;
    fill(color: string | LinearGradient): Diagram;
    stroke(color: string): Diagram;
    opacity(opacity: number): Diagram;
    strokewidth(width: number): Diagram;
    strokelinecap(linecap: 'butt' | 'round' | 'square'): Diagram;
    strokelinejoin(linejoin: 'arcs' | 'bevel' | 'miter' | 'miter-clip' | 'round'): Diagram;
    strokedasharray(dasharray: number[]): Diagram;
    vectoreffect(vectoreffect: 'none' | 'non-scaling-stroke' | 'non-scaling-size' | 'non-rotation' | 'fixed-position'): Diagram;
    filter(filter: string): Diagram;
    textfill(color: string): Diagram;
    textstroke(color: string): Diagram;
    textstrokewidth(width: number): Diagram;
    private update_textdata;
    fontfamily(fontfamily: string): Diagram;
    fontstyle(fontstyle: string): Diagram;
    fontsize(fontsize: number): Diagram;
    fontweight(fontweight: 'normal' | 'bold' | 'bolder' | 'lighter' | number): Diagram;
    fontscale(fontscale: number | 'auto'): Diagram;
    textanchor(textanchor: 'start' | 'middle' | 'end'): Diagram;
    textdy(dy: string): Diagram;
    textangle(angle: number): Diagram;
    text_tovar(): Diagram;
    text_totext(): Diagram;
    /**
     * Get the bounding box of the diagram
     * @returns [min, max] where min is the top left corner and max is the bottom right corner
     */
    bounding_box(): [Vector2, Vector2];
    /**
     * Transform the diagram by a function
     * @param transform_function function to transform the diagram
     */
    transform(transform_function: (p: Vector2) => Vector2): Diagram;
    /**
     * Translate the diagram by a vector
     * @param v vector to translate
     */
    translate(v: Vector2): Diagram;
    /**
     * move the diagram to a position
     * @param v position to move to (if left undefined, move to the origin)
     */
    position(v?: Vector2): Diagram;
    /**
     * Rotate the diagram by an angle around a pivot
     * @param angle angle to rotate
     * @param pivot pivot point, if left undefined, rotate around the origin
     */
    rotate(angle: number, pivot?: Vector2 | undefined): Diagram;
    /**
     * Scale the diagram by a scale around a origin
     * @param scale scale to scale (x, y)
     * @param origin origin point, if left undefined, scale around the origin
     */
    scale(scale: Vector2 | number, origin?: Vector2): Diagram;
    /**
     * Scale texts contained in the diagram by a scale
     * @param scale scaling factor
     */
    scaletext(scale: number): Diagram;
    /**
     * Skew the diagram in the x direction by an angle around a base
     * @param angle angle to skew
     * @param base base point, if left undefined, skew around the origin
     */
    skewX(angle: number, base?: Vector2): Diagram;
    /**
     * Skew the diagram in the y direction by an angle around a base
     * @param angle angle to skew
     * @param base base point, if left undefined, skew around the origin
     */
    skewY(angle: number, base?: Vector2): Diagram;
    /**
     * Reflect the diagram over a point
     * @param p point to reflect over
     */
    reflect_over_point(p: Vector2): Diagram;
    /**
     * Reflect the diagram over a line defined by two points
     * @param p1 point on the line
     * @param p2 point on the line
     */
    reflect_over_line(p1: Vector2, p2: Vector2): Diagram;
    /**
     * Reflect the diagram
     * if given 0 arguments, reflect over the origin
     * if given 1 argument, reflect over a point p1
     * if given 2 arguments, reflect over a line defined by two points p1 and p2
     * @param p1 point
     * @param p2 point
     */
    reflect(p1?: Vector2, p2?: Vector2): Diagram;
    /**
     * Vertical flip
     * Reflect the diagram over a horizontal line y = a
     * @param a y value of the line
     * if left undefined, flip over the origin
     */
    vflip(a?: number): Diagram;
    /**
     * Horizontal flip
     * Reflect the diagram over a vertical line x = a
     * @param a x value of the line
     * if left undefined, flip over the origin
     */
    hflip(a?: number): Diagram;
    /**
     * Get the position of the anchor of the diagram
     * @param anchor anchor to get, anchors can be
     *   'top-left', 'top-center', 'top-right'
     *   'center-left', 'center-center', 'center-right'
     *   'bottom-left', 'bottom-center', 'bottom-right'
     * @returns the position of the anchor
     */
    get_anchor(anchor: Anchor): Vector2;
    /**
     * Move the origin of the diagram to a position or anchor
     * @param pos position to move the origin to (Vector2), or anchor to move the origin to.
     * anchors can be
     *  'top-left', 'top-center', 'top-right'
     *  'center-left', 'center-center', 'center-right'
     *  'bottom-left', 'bottom-center', 'bottom-right'
     * * for texts, use `move_origin_text()`
     */
    move_origin(pos: Vector2 | Anchor): Diagram;
    /**
     * Move the origin of text diagram to an anchor
     * @param anchor anchor to move the origin to.
     * anchors can be
     * 'top-left', 'top-center', 'top-right'
     * 'center-left', 'center-center', 'center-right'
     * 'bottom-left', 'bottom-center', 'bottom-right'
     */
    private __move_origin_text;
    /**
     * Move the origin of text diagram to a position
     * @param anchor anchor to move the origin to.
     * anchors can be
     * 'top-left', 'top-center', 'top-right'
     * 'center-left', 'center-center', 'center-right'
     * 'bottom-left', 'bottom-center', 'bottom-right'
     *
     */
    move_origin_text(anchor: Anchor): Diagram;
    path_length(): number;
    /**
    * Reverse the order of the points in the path
    */
    reverse_path(): Diagram;
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
    parametric_point(t: number, segment_index?: number): Vector2;
    debug_bbox(): Diagram;
    debug(show_index?: boolean): Diagram;
    is_empty(): boolean;
}
declare class Path {
    points: Vector2[];
    mutable: boolean;
    constructor(points: Vector2[]);
    copy(): Path;
    copy_if_not_mutable(): Path;
    /**
    * Reverse the order of the points in the path
    */
    reverse(): Path;
    /**
     * Get the length of the path
     */
    length(): number;
    /**
     * add points to the path
     * @param points points to add
     */
    add_points(points: Vector2[]): Path;
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
    parametric_point(t: number, closed?: boolean, segment_index?: number): Vector2;
    /**
     * Tranfrom the path by a function
     * @param transform_function function to transform the path
     */
    transform(transform_function: (p: Vector2) => Vector2): Path;
}
/**
 * Combine multiple diagrams into one diagram
 * @param diagrams list of diagrams to combine
 * @returns a diagram
 */
declare function diagram_combine(...diagrams: Diagram[]): Diagram;
/**
 * Create a curve from a list of points
 * @param points list of points
 * @returns a curve diagram
 */
declare function curve(points: Vector2[]): Diagram;
/**
 * Create a line from start to end
 * @param start start point
 * @param end end point
 * @returns a line diagram
 */
declare function line$1(start: Vector2, end: Vector2): Diagram;
/**
 * Create a polygon from a list of points
 * @param points list of points
 * @returns a polygon diagram
 */
declare function polygon(points: Vector2[]): Diagram;
/**
 * Create an empty diagram, contain just a single point
 * @param v position of the point
 * @returns an empty diagram
 */
declare function empty(v?: Vector2): Diagram;
/**
 * Create a text diagram
 * @param str text to display
 * @returns a text diagram
 */
declare function text(str: string): Diagram;
/**
 * Create an image diagram
 * @param src image source
 * @param width width of the image
 * @param height height of the image
 * @returns an image diagram
 */
declare function image(src: string, width: number, height: number): Diagram;
/**
 * Create a multiline text diagram
 * @param strs list of text to display
 */
declare function multiline(spans: ([string] | [string, Partial<TextData>])[]): Diagram;
declare function multiline_bb(bbstr: string, linespace?: string, split_by_word?: boolean): Diagram;

type VerticalAlignment = 'top' | 'center' | 'bottom';
type HorizontalAlignment = 'left' | 'center' | 'right';
/**
 * Align diagrams vertically
 * @param diagrams diagrams to be aligned
 * @param alignment vertical alignment of the diagrams
 * alignment can be 'top', 'center', or 'bottom'
 * @returns array of aligned diagrams
 */
declare function align_vertical(diagrams: Diagram[], alignment?: VerticalAlignment): Diagram;
/**
 * Align diagrams horizontally
 * @param diagrams diagrams to be aligned
 * @param alignment horizontal alignment of the diagrams
 * alignment can be 'left', 'center', or 'right'
 * @returns array of aligned diagrams
 */
declare function align_horizontal(diagrams: Diagram[], alignment?: HorizontalAlignment): Diagram;
/**
 * Distribute diagrams horizontally
 * @param diagrams diagrams to be distributed
 * @param space space between the diagrams (default = 0)
 * @returns array of distributed diagrams
 */
declare function distribute_horizontal(diagrams: Diagram[], space?: number): Diagram;
/**
 * Distribute diagrams vertically
 * @param diagrams diagrams to be distributed
 * @param space space between the diagrams (default = 0)
 * @returns array of distributed diagrams
 */
declare function distribute_vertical(diagrams: Diagram[], space?: number): Diagram;
/**
 * Distribute diagrams horizontally and align
 * @param diagrams diagrams to be distributed
 * @param horizontal_space space between the diagrams (default = 0)
 * @param alignment vertical alignment of the diagrams
 * alignment can be 'top', 'center', or 'bottom'
 * @returns array of distributed and aligned diagrams
 */
declare function distribute_horizontal_and_align(diagrams: Diagram[], horizontal_space?: number, alignment?: VerticalAlignment): Diagram;
/**
 * Distribute diagrams vertically and align
 * @param diagrams diagrams to be distributed
 * @param vertical_space space between the diagrams (default = 0)
 * @param alignment horizontal alignment of the diagrams
 * alignment can be 'left', 'center', or 'right'
 * @returns array of distributed and aligned diagrams
 */
declare function distribute_vertical_and_align(diagrams: Diagram[], vertical_space?: number, alignment?: HorizontalAlignment): Diagram;
/**
 * Distribute diagrams in a grid
 * @param diagrams diagrams to be distributed
 * @param column_count number of columns
 * @param vectical_space space between the diagrams vertically (default = 0)
 * @param horizontal_space space between the diagrams horizontally (default = 0)
 * NODE: the behaviour is updated in v1.3.0
 * (now the returned diagram's children is the distributed diagrams instead of list of list of diagrams)
 */
declare function distribute_grid_row(diagrams: Diagram[], column_count: number, vectical_space?: number, horizontal_space?: number): Diagram;
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
declare function distribute_variable_row(diagrams: Diagram[], container_width: number, vertical_space?: number, horizontal_space?: number, vertical_alignment?: VerticalAlignment, horizontal_alignment?: HorizontalAlignment): Diagram;

type formatFunction = (name: string, value: any, prec?: number) => string;
type setter_function_t = (_: any) => void;
type inpVariables_t = {
    [key: string]: any;
};
type inpSetter_t = {
    [key: string]: setter_function_t;
};
declare enum HTML_INT_TARGET {
    DOCUMENT = "document",
    SVG = "svg"
}
/**
 * Object that controls the interactivity of the diagram
 */
declare class Interactive {
    control_container_div: HTMLElement;
    diagram_outer_svg?: SVGSVGElement | undefined;
    event_target: HTML_INT_TARGET;
    inp_variables: inpVariables_t;
    inp_setter: inpSetter_t;
    display_mode: "svg" | "canvas";
    diagram_svg: SVGSVGElement | undefined;
    locator_svg: SVGSVGElement | undefined;
    dnd_svg: SVGSVGElement | undefined;
    custom_svg: SVGSVGElement | undefined;
    button_svg: SVGSVGElement | undefined;
    private locatorHandler?;
    private dragAndDropHandler?;
    private buttonHandler?;
    private focus_padding;
    draw_function: (inp_object: inpVariables_t, setter_object?: inpSetter_t) => any;
    display_precision: undefined | number;
    intervals: {
        [key: string]: any;
    };
    registeredEventListenerRemoveFunctions: (() => void)[];
    single_int_mode: boolean;
    /**
     * @param control_container_div the div that contains the control elements
     * @param diagram_outer_svg the svg element that contains the diagram
     * \* _only needed if you want to use the locator_
     * @param inp_object_ the object that contains the variables
     * \* _only needed if you want to use custom input object_
     */
    constructor(control_container_div: HTMLElement, diagram_outer_svg?: SVGSVGElement | undefined, inp_object_?: {
        [key: string]: any;
    }, event_target?: HTML_INT_TARGET);
    draw(): void;
    set(variable_name: string, val: any): void;
    get(variable_name: string): any;
    label(variable_name: string, value: any, color?: string, markType?: 'square' | 'circle', markColor?: string, display_format_func?: formatFunction): void;
    /**
     * WARNING: deprecated
     * use `locator_initial_draw` instead
     */
    locator_draw(): void;
    locator_initial_draw(): void;
    /**
     * alias for `dnd_initial_draw`
     */
    drag_and_drop_initial_draw(): void;
    dnd_initial_draw(): void;
    private registerEventListener;
    removeRegisteredEventListener(): void;
    get_svg_element(metaname: string, force_recreate?: boolean): SVGSVGElement;
    get_diagram_svg(): SVGSVGElement;
    isTargetingDocument(): boolean;
    set_focus_padding(padding: number): void;
    /**
     * Create a locator
     * Locator is a draggable object that contain 2D coordinate information
     * @param variable_name name of the variable
     * @param value initial value
     * @param radius radius of the locator draggable object
     * @param color color of the locator
     * @param track_diagram if provided, the locator will snap to the closest point on the diagram
     */
    locator(variable_name: string, value: Vector2, radius: number, color?: string, track_diagram?: Diagram, blink?: boolean, callback?: (locator_name: string, position: Vector2) => any): void;
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
    locator_custom(variable_name: string, value: Vector2, diagram: Diagram, track_diagram?: Diagram, blink?: boolean, callback?: (locator_name: string, position: Vector2) => any, callback_rightclick?: (locator_name: string) => any): void;
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
    slider(variable_name: string, min?: number, max?: number, value?: number, step?: number, time?: number, display_format_func?: formatFunction): void;
    private init_drag_and_drop;
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
    dnd_container(name: string, diagram: Diagram, capacity?: number, config?: dnd_container_config): void;
    /**
     * Create a drag and drop draggable that is positioned into an existing container
     * @param name name of the draggable
     * @param diagram diagram of the draggable
     * @param container_name name of the container
     * @param callback callback function (called after the draggable is moved)
     * @param onclickstart_callback callback function (called at the start of the drag)
     */
    dnd_draggable_to_container(name: string, diagram: Diagram, container_name: string, callback?: (name: string, container: string) => any, onclickstart_callback?: () => any): void;
    /**
     * Create a drag and drop draggable
     * @param name name of the draggable
     * @param diagram diagram of the draggable
     * @param container_diagram diagram of the container, if not provided, a container will be created automatically
     * @param callback callback function (called after the draggable is moved)
     * @param onclickstart_callback callback function (called at the start of the drag)
    */
    dnd_draggable(name: string, diagram: Diagram, container_diagram?: Diagram, callback?: (name: string, pos: Vector2) => any, onclickstart_callback?: () => any): void;
    /**
     * Register a callback function when a draggable is dropped outside of a container
     * @param callback callback function
     */
    dnd_register_drop_outside_callback(callback: (name: string) => any): void;
    /**
     * Register a validation function when a draggable is moved to a container
     * If the function return false, the draggable will not be moved
     * @param fun validation function
    */
    dnd_register_move_validation_function(fun: (draggable_name: string, target_name: string) => boolean): void;
    /**
     * Move a draggable to a container
     * @param name name of the draggable
     * @param container_name name of the container
     */
    dnd_move_to_container(name: string, container_name: string): void;
    /**
     * Get the data of the drag and drop objects with the format:
     * `{container:string, content:string[]}[]`
    */
    get_dnd_data(): DragAndDropData;
    /**
     * Set the data of the drag and drop objects with the format:
     * `{container:string, content:string[]}[]`
     */
    set_dnd_data(data: DragAndDropData): void;
    /**
    * reorder the tabindex of the containers
    * @param container_names
    */
    dnd_reorder_tabindex(container_names: string[]): void;
    /**
    * Get the content size of a container
    */
    get_dnd_container_content_size(container_name: string): [number, number];
    /**
     * Set whether the content of the container should be sorted or not
     */
    set_dnd_content_sort(sort_content: boolean): void;
    remove_dnd_draggable(name: string): void;
    remove_locator(name: string): void;
    remove_button(name: string): void;
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
    custom_object(id: string, classlist: string[], diagram: Diagram): SVGSVGElement;
    /**
     * Create a custom interactive object
     * @param id id of the object
     * @param classlist list of classes of the object
     * @param diagram diagram of the object
     * @returns the <g> svg element of the object
     */
    custom_object_g(id: string, classlist: string[], diagram: Diagram): SVGGElement;
    private init_button;
    /**
     * Create a toggle button
     * @param name name of the button
     * @param diagram_on diagram of the button when it is on
     * @param diagram_off diagram of the button when it is off
     * @param state initial state of the button
     * @param callback callback function when the button state is changed
    */
    button_toggle(name: string, diagram_on: Diagram, diagram_off: Diagram, state?: boolean, callback?: (name: string, state: boolean) => any): void;
    /**
     * Create a click button
     * @param name name of the button
     * @param diagram diagram of the button
     * @param diagram_pressed diagram of the button when it is pressed
     * @param callback callback function when the button is clicked
    */
    button_click(name: string, diagram: Diagram, diagram_pressed: Diagram, callback: () => any): void;
    /**
     * Create a click button
     * @param name name of the button
     * @param diagram diagram of the button
     * @param diagram_pressed diagram of the button when it is pressed
     * @param diagram_hover diagram of the button when it is hovered
     * @param callback callback function when the button is clicked
    */
    button_click_hover(name: string, diagram: Diagram, diagram_pressed: Diagram, diagram_hover: Diagram, callback: () => any): void;
}
type LocatorEvent = TouchEvent | Touch | MouseEvent;
/**
 * Convert client position to SVG position
 * @param clientPos the client position
 * @param svgelem the svg element
 */
declare function clientPos_to_svgPos(clientPos: {
    x: number;
    y: number;
}, svgelem: SVGSVGElement): {
    x: number;
    y: number;
};
/**
 * Get the SVG coordinate from the event (MouseEvent or TouchEvent)
 * @param evt the event
 * @param svgelem the svg element
 * @returns the SVG coordinate
 */
declare function get_SVGPos_from_event(evt: LocatorEvent, svgelem: SVGSVGElement): {
    x: number;
    y: number;
};
type DragAndDropData = {
    container: string;
    content: string[];
}[];
type dnd_container_positioning_type = {
    type: "horizontal-uniform";
} | {
    type: "vertical-uniform";
} | {
    type: "horizontal";
    padding: number;
} | {
    type: "vertical";
    padding: number;
} | {
    type: "flex-row";
    padding: number;
    vertical_alignment?: VerticalAlignment;
    horizontal_alignment?: HorizontalAlignment;
} | {
    type: "grid";
    value: [number, number];
};
type dnd_container_config = dnd_container_positioning_type & {
    custom_region_box?: [Vector2, Vector2];
    sorting_function?: (a: string, b: string) => number;
};

/**
 * content elements are muatable
 * becuase dom itself inhernetly mutable
 *
 */
interface ContentElement {
    id: string;
    type: string;
    appendTo(container: HTMLDivElement): void;
    getElement(): Element;
    getSubElements?(): ContentElement[];
}
declare class Content {
    private elements;
    private elementMap;
    private nextId;
    private contentDiv;
    constructor(contentDiv: HTMLDivElement);
    private generateId;
    addElement(element: ContentElement, type: string): this;
    private addElementRecursively;
    getAllElements(): ContentElement[];
    getElement(id: string): ContentElement | undefined;
    static CombineELements(parenElement: HTMLDivElement, ...elemeents: ContentElement[]): HTMLDivElement;
}
declare class Drawing implements ContentElement {
    width: number;
    height: number;
    id: string;
    readonly type: string;
    private element;
    drawingContainer: HTMLDivElement | null;
    private callbacks;
    constructor(width: number, height: number);
    appendTo(container: HTMLDivElement): void;
    init(): {
        draw: (...diagrams: any) => void;
        int: Interactive;
    } | undefined;
    getElement(): SVGSVGElement;
    private attachEventListeners;
    emit(eventName: string): void;
    on(eventName: string, callback: Function): void;
}
declare class Paragraph implements ContentElement {
    text: string;
    id: string;
    readonly type: string;
    private element;
    private callbacks;
    constructor(text: string);
    private attachEventListeners;
    appendTo(container: HTMLDivElement): void;
    getElement(): HTMLParagraphElement;
    emit(eventName: string): void;
    on(eventName: string, callback: Function): void;
}
declare class Header implements ContentElement {
    text: string;
    level: number;
    id: string;
    readonly type: string;
    private element;
    private callbacks;
    constructor(text: string, level: number);
    appendTo(container: HTMLDivElement): void;
    getElement(): HTMLElement;
    private attachEventListeners;
    emit(eventName: string): void;
    on(eventName: string, callback: Function): void;
}
declare class Quizz implements ContentElement {
    id: string;
    readonly type: string;
    private questionElements;
    private options;
    element: Element;
    private selectedOptions;
    private explanationElements;
    private callbacks;
    private isMultipleSelection;
    private hint;
    private isExplanationVisible;
    constructor(questionElements: ContentElement[], options: ContentElement[], isMultipleSelection?: boolean, hint?: string, explanationElements?: ContentElement[]);
    private initQuizz;
    private addQuestion;
    private addOptions;
    private onOptionClick;
    private updateOptionSelections;
    private addExplanationButton;
    private toggleExplanation;
    private addHint;
    private addSubmitButton;
    private onSubmit;
    emit(eventName: string, data?: any): void;
    on(eventName: string, callback: Function): void;
    getElement(): Element;
    appendTo(container: HTMLDivElement): void;
    getSubElements(): ContentElement[];
}

/**
 * Helper function to convert from degrees to radians
 */
declare function to_radian(angle: number): number;
/**
 * Helper function to convert from radians to degrees
 */
declare function to_degree(angle: number): number;
declare function array_repeat<T>(arr: T[], len: number): T[];
/**
 * Create a equivalently spaced array of numbers from start to end (inclusive)
 * [start, end]
 * @param start start value
 * @param end end value
 * @param n number of points
 */
declare function linspace(start: number, end: number, n?: number): number[];
/**
 * Create a equivalently spaced array of numbers from start to end (exclusice)
 * [start, end)
 * @param start start value
 * @param end end value
 * @param n number of points
 */
declare function linspace_exc(start: number, end: number, n?: number): number[];
/**
 * Create a equivalently spaced array of numbers from start to end (exclusive)
 * [start, end)
 * @param start start value
 * @param end end value
 * @param step step size
 */
declare function range(start: number, end: number, step?: number): number[];
/**
 * Create a equivalently spaced array of numbers from start to end (inc)
 * [start, end]
 * @param start start value
 * @param end end value
 * @param step step size
 */
declare function range_inc(start: number, end: number, step?: number): number[];
/**
 * Transpose a 2D array
 * if the array is not a rectangle, the transposed array will be padded with undefined
 * @param arr 2D array
 * @returns transposed 2D array
 */
declare function transpose<T>(arr: T[][]): (T | undefined)[][];
declare function expand_directional_value(padding: number | number[]): [number, number, number, number];

declare const utils_array_repeat: typeof array_repeat;
declare const utils_expand_directional_value: typeof expand_directional_value;
declare const utils_linspace: typeof linspace;
declare const utils_linspace_exc: typeof linspace_exc;
declare const utils_range: typeof range;
declare const utils_range_inc: typeof range_inc;
declare const utils_to_degree: typeof to_degree;
declare const utils_to_radian: typeof to_radian;
declare const utils_transpose: typeof transpose;
declare namespace utils {
  export { utils_array_repeat as array_repeat, utils_expand_directional_value as expand_directional_value, utils_linspace as linspace, utils_linspace_exc as linspace_exc, utils_range as range, utils_range_inc as range_inc, utils_to_degree as to_degree, utils_to_radian as to_radian, utils_transpose as transpose };
}

declare const default_diagram_style: DiagramStyle;
declare const _init_default_diagram_style: DiagramStyle;
declare const default_text_diagram_style: DiagramStyle;
declare const _init_default_text_diagram_style: DiagramStyle;
declare const default_textdata: TextData;
declare const _init_default_textdata: TextData;
declare function reset_default_styles(): void;
/**
 * Get all svg elements with a specific tag
 * @param svgelement the svg element to search
 * @param tag the tag to search
 * @returns a list of svg elements with the tag
 */
declare function get_tagged_svg_element(tag: string, svgelement: SVGElement): SVGElement[];
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
declare function draw_to_svg(outer_svgelement: SVGSVGElement, diagram: Diagram, set_html_attribute?: boolean, render_text?: boolean, clear_svg?: boolean): void;
interface draw_to_svg_options {
    set_html_attribute?: boolean;
    render_text?: boolean;
    clear_svg?: boolean;
    embed_image?: boolean;
    background_color?: string;
    padding?: number | number[];
    text_scaling_reference_svg?: SVGSVGElement;
    text_scaling_reference_padding?: number | number[];
    filter_strings?: string[];
}
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
declare function draw_to_svg_element(outer_svgelement: SVGSVGElement, diagram: Diagram, options?: draw_to_svg_options): void;
type texhandler_config = {
    display: boolean;
};
type texhadler_function = (texstr: string, config: texhandler_config) => string;
/**
 * Recursively handle tex in svg
 * @param svg the svg element to handle
 * @param texhandler the tex handler function
 */
declare function handle_tex_in_svg(svg: SVGElement, texhandler: texhadler_function): void;
/**
 * Download the svg as svg file
 * @param outer_svgelement the outer svg element to download
 */
declare function download_svg_as_svg(outer_svgelement: SVGSVGElement): void;
/**
 * Download the svg as png file
 * @param outer_svgelement the outer svg element to download
 */
declare function download_svg_as_png(outer_svgelement: SVGSVGElement): void;

/**
 * Create rectange centered at origin
 * @param width width of the rectangle
 * @param height height of the rectangle
 * @returns a Diagram object
 */
declare function rectangle(width: number, height: number): Diagram;
/**
 * Create rectange with a given bottom left corner and top right corner
 * @param bottomleft bottom left corner of the rectangle
 * @param topright top right corner of the rectangle
 * @returns a Diagram object
 */
declare function rectangle_corner(bottomleft: Vector2, topright: Vector2): Diagram;
/**
 * Create square centered at origin
 * @param side side length of the square
 * @returns a Diagram object
 */
declare function square(side?: number): Diagram;
/**
 * Create regular polygon centered at origin with a given radius
 * @param n number of sides
 * @param radius radius of the polygon
 * @returns a Diagram object
 * \* if you want to create a regular polygon with a given side length, use regular_polygon_side
 */
declare function regular_polygon(n: number, radius?: number): Diagram;
/**
 * Create regular polygon centered at origin with a given side length
 * @param n number of sides
 * @param sidelength side length of the polygon
 * @returns a Diagram object
 * \* if you want to create a regular polygon with a given radius, use regular_polygon
 */
declare function regular_polygon_side(n: number, sidelength?: number): Diagram;
/**
 * Create circle centered at origin
 * *currently implemented as a regular polygon with 50 sides*
 * @param radius radius of the circle
 * @returns a Diagram object
 */
declare function circle(radius?: number): Diagram;
/**
 * Create an arc centered at origin
 * @param radius radius of the arc
 * @param angle angle of the arc
 * @returns a Diagram object
 */
declare function arc(radius?: number, angle?: number): Diagram;
/**
 * Create an arrow from origin to a given point
 * @param v the end point of the arrow
 * @param headsize size of the arrow head
 * @returns a Diagram object
 */
declare function arrow(v: Vector2, headsize?: number): Diagram;
/**
 * Create an arrow from a given point to another given point
 * @param start the start point of the arrow
 * @param end the end point of the arrow
 * @param headsize size of the arrow head
 * @returns a Diagram object
 */
declare function arrow1(start: Vector2, end: Vector2, headsize?: number): Diagram;
/**
 * Create a two-sided arrow from a given point to another given point
 * @param start the start point of the arrow
 * @param end the end point of the arrow
 * @param headsize size of the arrow head
 * @returns a Diagram object
 */
declare function arrow2$1(start: Vector2, end: Vector2, headsize?: number): Diagram;
/**
 * Create a text object with mathematical italic font
 * @param str text to be displayed
 * @returns a Diagram object
 */
declare function textvar(str: string): Diagram;

declare function str_latex_to_unicode(str: string): string;
declare function str_to_mathematical_italic(str: string): string;

type modifierFunction = (d: Diagram) => Diagram;
/**
 * Resample a diagram so that it has `n` points
 * @param n number of points
 * @returns function that modifies a diagram
 */
declare function resample(n: number): modifierFunction;
/**
 * Subdivide each segment of a diagram into n segments
 * @param n number of segments to subdivide each segment into
 * @returns function that modifies a diagram
 */
declare function subdivide(n?: number): modifierFunction;
/**
 * Get a slice of a diagram from `t_start` to `t_end`
 * @param t_start starting point of the slice
 * @param t_end ending point of the slice
 * @param n number of points in the slice
 * @returns function that modifies a diagram
 */
declare function slicepath(t_start: number, t_end: number, n?: number): modifierFunction;
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
declare function round_corner(radius?: number | number[], point_indices?: number[], count?: number): modifierFunction;
/**
 * Add an arrow to the end of a curve
 * Make sure the diagram this modifier is applied to is a curve
 * @param headsize size of the arrow head
 * @param flip flip the arrow position
 */
declare function add_arrow(headsize: number, flip?: boolean): modifierFunction;
/**
* Replace arrowhead inside a diagram with another diagram
* @param new_arrowhead diagram to replace the arrowhead with
* The arrow will be rotated automatically,
* The default direction is to the right (+x) with the tip at the origin
*/
declare function arrowhead_replace(new_arrowhead: Diagram): modifierFunction;

declare const modifier_add_arrow: typeof add_arrow;
declare const modifier_arrowhead_replace: typeof arrowhead_replace;
declare const modifier_resample: typeof resample;
declare const modifier_round_corner: typeof round_corner;
declare const modifier_slicepath: typeof slicepath;
declare const modifier_subdivide: typeof subdivide;
declare namespace modifier {
  export { modifier_add_arrow as add_arrow, modifier_arrowhead_replace as arrowhead_replace, modifier_resample as resample, modifier_round_corner as round_corner, modifier_slicepath as slicepath, modifier_subdivide as subdivide };
}

declare function union(d1: Diagram, d2: Diagram, tolerance?: number): Diagram;
declare function difference(d1: Diagram, d2: Diagram, tolerance?: number): Diagram;
declare function intersect$1(d1: Diagram, d2: Diagram, tolerance?: number): Diagram;
declare function xor(d1: Diagram, d2: Diagram, tolerance?: number): Diagram;

declare const boolean_difference: typeof difference;
declare const boolean_union: typeof union;
declare const boolean_xor: typeof xor;
declare namespace boolean {
  export { boolean_difference as difference, intersect$1 as intersect, boolean_union as union, boolean_xor as xor };
}

declare namespace string_filter {
    function outer_shadow(dx: number, dy: number, radius: number, stdev: number, color: string, id: string | undefined, width: number, height: number, scale_factor?: number): string;
}

declare const filter_string_filter: typeof string_filter;
declare namespace filter {
  export { filter_string_filter as string_filter };
}

/**
 * Options for axes
 * Since axes, plot, etc. are separate objects.
 * Axes options is used so that it's easier to have consistent
 * setting for multiple objects.
 */
type axes_options = {
    xrange: [number, number];
    yrange: [number, number];
    bbox?: [Vector2, Vector2];
    xticks?: number[];
    yticks?: number[];
    n_sample?: number;
    ticksize: number;
    headsize: number;
    tick_label_offset?: number;
};
declare let default_axes_options: axes_options;
declare function axes_transform(axes_options?: Partial<axes_options>): (v: Vector2) => Vector2;
declare let ax: typeof axes_transform;
/**
 * Draw xy axes without ticks
 * @param axes_options options for the axes
 * example: opt = {
 *    bbox   : [V2(-100,-100), V2(100,100)],
 * }
 * @returns a Diagram object
 */
declare function axes_empty(axes_options?: Partial<axes_options>): Diagram;
/**
 * Draw xy corner axes without ticks
 * @param axes_options options for the axes
 * example: opt = {
 *    bbox   : [V2(-100,-100), V2(100,100)],
 * }
 * @returns a Diagram object
 */
declare function axes_corner_empty(axes_options?: Partial<axes_options>): Diagram;
/**
 * Draw xy corner axes without ticks and with break mark in x axis
 * @param axes_options options for the axes
 */
declare function axes_corner_empty_xbreak(axes_options?: Partial<axes_options>): Diagram;
/**
 * Create a single tick mark in the x axis
 * @param x x coordinate of the tick mark
 * @param y y coordinate of the tick mark
 * @param height height of the tick mark
 */
declare function xtickmark_empty(x: number, y: number, axes_options?: Partial<axes_options>): Diagram;
declare function xtickmark(x: number, y: number, str: string, axes_options?: Partial<axes_options>): Diagram;
/**
 * Create a single tick mark in the y axis
 * @param y y coordinate of the tick mark
 * @param x x coordinate of the tick mark
 * @param height height of the tick mark
 */
declare function ytickmark_empty(y: number, x: number, axes_options?: Partial<axes_options>): Diagram;
declare function ytickmark(y: number, x: number, str: string, axes_options?: Partial<axes_options>): Diagram;
declare function get_tick_numbers(min: number, max: number, exclude_zero?: boolean): number[];
declare function xticks(axes_options: Partial<axes_options>, y?: number, empty?: boolean): Diagram;
declare function yticks(axes_options: Partial<axes_options>, x?: number, empty?: boolean): Diagram;
/**
 * Draw xy corner axes with ticks
 * @param axes_options options for the axes
 */
declare function xycorneraxes(axes_options?: Partial<axes_options>): Diagram;
/**
 * Draw xy corner axes with ticks and break mark in x axis
 * @param axes_options options for the axes
 */
declare function xycorneraxes_xbreak(axes_options?: Partial<axes_options>): Diagram;
/**
 * Draw xy axes with ticks
 * @param axes_options options for the axes
 */
declare function xyaxes(axes_options?: Partial<axes_options>): Diagram;
/**
 * Draw x axis with ticks
 * @param axes_options options for the axis
 */
declare function xaxis(axes_options?: Partial<axes_options>): Diagram;
/**
 * Draw y axis with ticks
 * @param axes_options options for the axis
 */
declare function yaxis(axes_options?: Partial<axes_options>): Diagram;
declare function ygrid(axes_options?: Partial<axes_options>): Diagram;
declare function xgrid(axes_options?: Partial<axes_options>): Diagram;
declare function xygrid(axes_options?: Partial<axes_options>): Diagram;
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
declare function plotv(data: Vector2[], axes_options?: Partial<axes_options>): Diagram;
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
declare function plot$1(xdata: number[], ydata: number[], axes_options?: Partial<axes_options>): Diagram;
/**
 * Plot a function
 * @param f function to plot
 * @param n number of points to plot
 * @param axes_options options for the axes
 */
declare function plotf(f: (x: number) => number, axes_options?: Partial<axes_options>): Diagram;
declare function under_curvef(f: (x: number) => number, x_start: number, x_end: number, axes_options?: Partial<axes_options>): Diagram;

declare const shapes_graph_ax: typeof ax;
declare const shapes_graph_axes_corner_empty: typeof axes_corner_empty;
declare const shapes_graph_axes_corner_empty_xbreak: typeof axes_corner_empty_xbreak;
declare const shapes_graph_axes_empty: typeof axes_empty;
type shapes_graph_axes_options = axes_options;
declare const shapes_graph_axes_transform: typeof axes_transform;
declare const shapes_graph_default_axes_options: typeof default_axes_options;
declare const shapes_graph_get_tick_numbers: typeof get_tick_numbers;
declare const shapes_graph_plotf: typeof plotf;
declare const shapes_graph_plotv: typeof plotv;
declare const shapes_graph_under_curvef: typeof under_curvef;
declare const shapes_graph_xaxis: typeof xaxis;
declare const shapes_graph_xgrid: typeof xgrid;
declare const shapes_graph_xtickmark: typeof xtickmark;
declare const shapes_graph_xtickmark_empty: typeof xtickmark_empty;
declare const shapes_graph_xticks: typeof xticks;
declare const shapes_graph_xyaxes: typeof xyaxes;
declare const shapes_graph_xycorneraxes: typeof xycorneraxes;
declare const shapes_graph_xycorneraxes_xbreak: typeof xycorneraxes_xbreak;
declare const shapes_graph_xygrid: typeof xygrid;
declare const shapes_graph_yaxis: typeof yaxis;
declare const shapes_graph_ygrid: typeof ygrid;
declare const shapes_graph_ytickmark: typeof ytickmark;
declare const shapes_graph_ytickmark_empty: typeof ytickmark_empty;
declare const shapes_graph_yticks: typeof yticks;
declare namespace shapes_graph {
  export { shapes_graph_ax as ax, shapes_graph_axes_corner_empty as axes_corner_empty, shapes_graph_axes_corner_empty_xbreak as axes_corner_empty_xbreak, shapes_graph_axes_empty as axes_empty, type shapes_graph_axes_options as axes_options, shapes_graph_axes_transform as axes_transform, shapes_graph_default_axes_options as default_axes_options, shapes_graph_get_tick_numbers as get_tick_numbers, plot$1 as plot, shapes_graph_plotf as plotf, shapes_graph_plotv as plotv, shapes_graph_under_curvef as under_curvef, shapes_graph_xaxis as xaxis, shapes_graph_xgrid as xgrid, shapes_graph_xtickmark as xtickmark, shapes_graph_xtickmark_empty as xtickmark_empty, shapes_graph_xticks as xticks, shapes_graph_xyaxes as xyaxes, shapes_graph_xycorneraxes as xycorneraxes, shapes_graph_xycorneraxes_xbreak as xycorneraxes_xbreak, shapes_graph_xygrid as xygrid, shapes_graph_yaxis as yaxis, shapes_graph_ygrid as ygrid, shapes_graph_ytickmark as ytickmark, shapes_graph_ytickmark_empty as ytickmark_empty, shapes_graph_yticks as yticks };
}

declare enum TAG {
    EMPTY = "empty",
    LINE = "line",
    CIRCLE = "circle",
    TEXTVAR = "textvar",
    ROW_ = "row_",
    COL_ = "col_",
    ARROW_LINE = "arrow_line",
    ARROW_HEAD = "arrow_head",
    TABLE = "table",
    CONTAIN_TABLE = "contain_table",
    TABLE_CELL = "table_cell",
    TABLE_CONTENT = "table_content",
    EMPTY_CELL = "empty_cell",
    GRAPH_AXIS = "graph_axis_line",
    GRAPH_TICK = "graph_tick",
    GRAPH_TICK_LABEL = "graph_tick_label",
    GRAPH_GRID = "graph_grid"
}

/**
 * Calculate the area of a polygon
 * @param p a polygon Diagram
 * if p is a Diagram with children, calculate the sum of the areas of the children
 * @returns area of the polygon
*/
declare function area(p: Diagram): number;
/**
 * Get the radius of a circle
 * @param circle a circle Diagram
 * @returns radius of the circle
 */
declare function circle_radius(circle: Diagram): number;
/**
 * Get the tangent points of a circle from a point
 * @param point a point
 * @param circle a circle Diagram
 */
declare function circle_tangent_point_from_point(point: Vector2, circle: Diagram): [Vector2, Vector2];
/**
 * Get the points of a line
 * @param l a line Diagram
 * @returns the two points of the line
 */
declare function line_points(l: Diagram): [Vector2, Vector2];
/**
 * Get the intersection of a line with a horizontal line at y = yi
 * @param l a line Diagram
 * @param yi y value of the horizontal line
 * @returns the intersection point
 */
declare function line_intersection_y(l: Diagram, yi: number): Vector2;
/**
 * Get the intersection of a line with a vertical line at x = xi
 * @param l a line Diagram
 * @param xi x value of the vertical line
 * @returns the intersection point
 */
declare function line_intersection_x(l: Diagram, xi: number): Vector2;
/**
 * Get the intersection of two lines
 * @param l1 a line Diagram
 * @param l2 a line Diagram
 * @returns the intersection point
 * if the lines are parallel, return V2(Infinity, Infinity)
 */
declare function line_intersection$1(l1: Diagram, l2: Diagram): Vector2;
/**
 * Extend a line by a length on both ends
 * @param l a line Diagram
 * @param len1 length to extend on the first end
 * @param len2 length to extend on the second end
 * @returns a new line Diagram
 */
declare function line_extend(l: Diagram, len1: number, len2: number): Diagram;
/**
 * Get the size of a diagram
 * @param diagram a diagram
 * @returns the width and height of the diagram
 */
declare function size(diagram: Diagram): [number, number];

declare const shapes_geometry_area: typeof area;
declare const shapes_geometry_circle_radius: typeof circle_radius;
declare const shapes_geometry_circle_tangent_point_from_point: typeof circle_tangent_point_from_point;
declare const shapes_geometry_line_extend: typeof line_extend;
declare const shapes_geometry_line_intersection_x: typeof line_intersection_x;
declare const shapes_geometry_line_intersection_y: typeof line_intersection_y;
declare const shapes_geometry_line_points: typeof line_points;
declare const shapes_geometry_size: typeof size;
declare namespace shapes_geometry {
  export { shapes_geometry_area as area, shapes_geometry_circle_radius as circle_radius, shapes_geometry_circle_tangent_point_from_point as circle_tangent_point_from_point, shapes_geometry_line_extend as line_extend, line_intersection$1 as line_intersection, shapes_geometry_line_intersection_x as line_intersection_x, shapes_geometry_line_intersection_y as line_intersection_y, shapes_geometry_line_points as line_points, shapes_geometry_size as size };
}

/**
 * Create an annotation vector
 * @param v vector to be annotated
 * @param str string to be annotated (will be converted to mathematical italic)
 * if you don't want to convert to mathematical italic, use annotation.vector_text
 * @param arrow_head_size size of the arrow head
 * @param text_offset position offset of the text
 */
declare function vector(v: Vector2, str?: string, text_offset?: Vector2, arrow_head_size?: number): Diagram;
/**
 * Create an annotation for angle
 * @param p three points to define the angle
 * @param str string to be annotated (will be converted to mathematical italic)
 * @param radius radius of the arc
 * @param text_offset position offset of the text
 * if given as a number, the text will be placed at the angle bisector with the given distance from the vertex
 * if given as a vector, the text will be placed at the given position offset
 */
declare function angle(p: [Vector2, Vector2, Vector2], str?: string, radius?: number, text_offset?: Vector2 | number): Diagram;
/**
 * Create an annotation for angle (always be the smaller angle)
 * @param p three points to define the angle
 * @param str string to be annotated (will be converted to mathematical italic)
 * @param radius radius of the arc
 * @param text_offset position offset of the text
 * if given as a number, the text will be placed at the angle bisector with the given distance from the vertex
 * if given as a vector, the text will be placed at the given position offset
 */
declare function angle_smaller(p: [Vector2, Vector2, Vector2], str?: string, radius?: number, text_offset?: Vector2 | number): Diagram;
/**
 * Create an annotation for right angle
 * make sure the angle is 90 degree
 * @param p three points to define the angle
 * @param size size of the square
 */
declare function right_angle(p: [Vector2, Vector2, Vector2], size?: number): Diagram;
declare function length(p1: Vector2, p2: Vector2, str: string, offset: number, tablength?: number, textoffset?: number, tabsymmetric?: boolean): Diagram;
/**
 * Create a congruence mark
 * @param p1 start point of the line
 * @param p2 end point of the line
 * @param count number of marks
 * @param size size of the mark
 * @param gap gap between the marks
 */
declare function congruence_mark(p1: Vector2, p2: Vector2, count: number, size?: number, gap?: number): Diagram;
/**
 * Create a parallel mark
 * @param p1 start point of the line
 * @param p2 end point of the line
 * @param count number of marks
 * @param size size of the mark
 * @param gap gap between the marks
 * @param arrow_angle angle of the arrow
 */
declare function parallel_mark(p1: Vector2, p2: Vector2, count: number, size?: number, gap?: number, arrow_angle?: number): Diagram;

declare const shapes_annotation_angle: typeof angle;
declare const shapes_annotation_angle_smaller: typeof angle_smaller;
declare const shapes_annotation_congruence_mark: typeof congruence_mark;
declare const shapes_annotation_length: typeof length;
declare const shapes_annotation_parallel_mark: typeof parallel_mark;
declare const shapes_annotation_right_angle: typeof right_angle;
declare const shapes_annotation_vector: typeof vector;
declare namespace shapes_annotation {
  export { shapes_annotation_angle as angle, shapes_annotation_angle_smaller as angle_smaller, shapes_annotation_congruence_mark as congruence_mark, shapes_annotation_length as length, shapes_annotation_parallel_mark as parallel_mark, shapes_annotation_right_angle as right_angle, shapes_annotation_vector as vector };
}

/**
 * Create an inclined plane.
 * @param length The length of the inclined plane.
 * @param angle The angle of the inclined plane.
 * @returns A diagram of the inclined plane.
 */
declare function inclined_plane(length: number, angle: number): Diagram;
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
declare function spring(p1: Vector2, p2: Vector2, radius?: number, coil_number?: number, separation_coefficient?: number, sample_number?: number): Diagram;

declare const shapes_mechanics_inclined_plane: typeof inclined_plane;
declare const shapes_mechanics_spring: typeof spring;
declare namespace shapes_mechanics {
  export { shapes_mechanics_inclined_plane as inclined_plane, shapes_mechanics_spring as spring };
}

type bar_options = {
    gap: number;
    yrange?: [number, number];
    yticks?: number[];
    bbox?: [Vector2, Vector2];
    ticksize: number;
};
declare let default_bar_options$1: bar_options;
/**
 * Plot a bar chart
 * @param datavalues the data values to plot
 * @param bar_options options for the bar chart
 * @returns a diagram of the bar chart
 */
declare function plot(datavalues: number[], bar_options?: Partial<bar_options>): Diagram;
/**
 * x-axes with label for bar chart
 * @param datanames the data names
 * @param bar_options options for the bar chart
 * @returns a diagram of the x-axes
 */
declare function xaxes(datanames: string[], bar_options?: Partial<bar_options>): Diagram;
/**
 * y-axes with label for bar chart
 * @param datavalues the data values
 * @param bar_options options for the bar chart
 */
declare function yaxes(datavalues: number[], bar_options?: Partial<bar_options>): Diagram;
declare function axes_tansform(datavalues: number[], bar_options?: Partial<bar_options>): (v: Vector2) => Vector2;

declare const shapes_bar_axes_tansform: typeof axes_tansform;
type shapes_bar_bar_options = bar_options;
declare const shapes_bar_plot: typeof plot;
declare const shapes_bar_xaxes: typeof xaxes;
declare const shapes_bar_yaxes: typeof yaxes;
declare namespace shapes_bar {
  export { shapes_bar_axes_tansform as axes_tansform, type shapes_bar_bar_options as bar_options, default_bar_options$1 as default_bar_options, shapes_bar_plot as plot, shapes_bar_xaxes as xaxes, shapes_bar_yaxes as yaxes };
}

/**
 * Draw an empty axis from xmin to xmax with arrowsize
 * @param xmin minimum value of the numberline
 * @param xmax maximum value of the numberline
 * @param arrowsize the size of the arrowhead
 * returns a Diagram
 */
declare function axis(xmin: number, xmax: number, arrowsize?: number): Diagram;
/**
 * Draw a numbered ticks for a numberline
 * @param xs the values of the ticks
 * @param ticksize the size of the ticks
 * @param number_offset the offset of the number from the ticks
 * returns a Diagram
 */
declare function numbered_ticks(xs: number[], ticksize: number, number_offset: number): Diagram;
/**
 * Draw ticks for a numberline
 * @param xs the values of the ticks
 * @param ticksize the size of the ticks
 * returns a Diagram
 */
declare function ticks(xs: number[], ticksize: number): Diagram;
/**
 * Draw a single tick for a numberline
 * @param x the value of the tick
 * @param txt the text of the tick
 * @param ticksize the size of the tick
 * @param text_offset the offset of the text from the tick
 * returns a Diagram
 */
declare function single_tick(x: number, txt: string, ticksize: number, text_offset: number): Diagram;

declare const shapes_numberline_axis: typeof axis;
declare const shapes_numberline_numbered_ticks: typeof numbered_ticks;
declare const shapes_numberline_single_tick: typeof single_tick;
declare const shapes_numberline_ticks: typeof ticks;
declare namespace shapes_numberline {
  export { shapes_numberline_axis as axis, shapes_numberline_numbered_ticks as numbered_ticks, shapes_numberline_single_tick as single_tick, shapes_numberline_ticks as ticks };
}

declare enum TableOrientation {
    ROWS = "rows",
    COLUMNS = "columns"
}
type cell_style = {
    index: [number, number];
    fill?: string;
    stroke?: string;
    strokewidth?: number;
};
/**
 * Create a table with diagrams inside
 * @param diagrams 2D array of diagrams
 * @param orientation orientation of the table (default: 'rows')
 * can be 'rows' or 'columns'
 * @param min_rowsize minimum size of each row
 * @param min_colsize minimum size of each column
 * @returns a diagram of the table with the diagrams inside
 */
declare function table(diagrams: Diagram[][], padding?: number | number[], orientation?: TableOrientation, min_rowsize?: number, min_colsize?: number): Diagram;
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
declare function style_cell(table_diagram: Diagram, styles: cell_style[]): Diagram;
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
declare function fixed_size(diagrams: Diagram[][], rowsizes: number[], colsizes: number[], orientation?: TableOrientation): Diagram;
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
declare function empty_fixed_size(row_count: number, col_count: number, rowsizes: number[], colsizes: number[], empty_map: boolean[][]): Diagram;
/**
 * Get the midpoints of the cells from a table diagram
 * @param table_diagram a table diagram
 * @returns a 2D array of points
 * the first index is the row, the second index is the column
 */
declare function get_points(table_diagram: Diagram): Vector2[][];

type shapes_table_cell_style = cell_style;
declare const shapes_table_empty_fixed_size: typeof empty_fixed_size;
declare const shapes_table_fixed_size: typeof fixed_size;
declare const shapes_table_get_points: typeof get_points;
declare const shapes_table_style_cell: typeof style_cell;
declare const shapes_table_table: typeof table;
declare namespace shapes_table {
  export { type shapes_table_cell_style as cell_style, shapes_table_empty_fixed_size as empty_fixed_size, shapes_table_fixed_size as fixed_size, shapes_table_get_points as get_points, shapes_table_style_cell as style_cell, shapes_table_table as table };
}

type boxplot_options = {
    range?: [number, number];
    ticks?: number[];
    bbox?: [Vector2, Vector2];
    ticksize: number;
    headsize: number;
    orientation: 'x' | 'y';
    tick_label_offset?: number;
};
declare let default_bar_options: boxplot_options;
declare function to_ax_options(baropt: Partial<boxplot_options>): axes_options;
/**
 * axis for boxplot
 * @param bar_options options for the bar chart
 * @returns a diagram of the axes
 */
declare function axes(bar_options?: Partial<boxplot_options>): Diagram;
/**
 */
declare function empty_tickmarks(xs: number[], bar_options?: Partial<boxplot_options>): Diagram;
/**
 * Plot a boxplot from quartiles
 * @param quartiles [Q0, Q1, Q2, Q3, Q4]
 * @param pos position of the boxplot
 * @param size size of the boxplot
 * @param bar_options options for the bar chart
 * @returns a diagram of the boxplot
 */
declare function plotQ(quartiles: number[], pos: number, size: number, bar_options: Partial<boxplot_options>): Diagram;

declare const shapes_boxplot_axes: typeof axes;
type shapes_boxplot_boxplot_options = boxplot_options;
declare const shapes_boxplot_default_bar_options: typeof default_bar_options;
declare const shapes_boxplot_empty_tickmarks: typeof empty_tickmarks;
declare const shapes_boxplot_plotQ: typeof plotQ;
declare const shapes_boxplot_to_ax_options: typeof to_ax_options;
declare namespace shapes_boxplot {
  export { shapes_boxplot_axes as axes, type shapes_boxplot_boxplot_options as boxplot_options, shapes_boxplot_default_bar_options as default_bar_options, shapes_boxplot_empty_tickmarks as empty_tickmarks, shapes_boxplot_plotQ as plotQ, shapes_boxplot_to_ax_options as to_ax_options };
}

declare enum GeoType {
    LINE = "LINE"
}
type GeoCtx = {
    [key: string]: (GeoObj | Vector2 | number);
};
interface GeoObj {
    type: GeoType;
}
interface GeoLine extends GeoObj {
    type: GeoType.LINE;
    p: Vector2;
    dir: Vector2;
}
declare function intersect(o1: GeoObj, o2: GeoObj): Vector2[];
/**
 * Get a point that is `d` distance away from `p` in the direction of `dir`
 * *ideally, point `p` should be in line `l`*
 */
declare function point_onLine_atDistance_from(l: GeoLine, d: number, p: Vector2): Vector2;
/**
 * Get a point
 * - that is collinear with `p1` and `p2`
 * - that is `len` away from `p2` in the direction away from `p1`
 */
declare function point_collinear_extend_length(p1: Vector2, p2: Vector2, len: number): Vector2;
/** Get a point that is `t` fraction of the way from `p1` to `p2` */
declare function point_collinear_fraction(p1: Vector2, p2: Vector2, t: number): Vector2;
/** Get a point on line `l` with x-coordinate `x` */
declare function point_onLine_with_x(l: GeoLine, x: number): Vector2;
/** Get a point on line `l` with y-coordinate `y` */
declare function point_onLine_with_y(l: GeoLine, y: number): Vector2;
/** Get the intersection point of two lines */
declare function line_intersection(l1: GeoLine, l2: GeoLine): Vector2;
declare function line(p: Vector2, dir: Vector2): GeoLine;
declare function line_from_points(p1: Vector2, p2: Vector2): GeoLine;
declare function line_from_slope(p: Vector2, slope: number): GeoLine;
declare function line_from_angle(p: Vector2, angle: number): GeoLine;
/** Define a line that is parallel to `l` and passes through `p` */
declare function line_parallel_at_point(l: GeoLine, p: Vector2): GeoLine;
/** Define a line that is perpendicular to `l` and passes through `p` */
declare function line_perpendicular_at_point(l: GeoLine, p: Vector2): GeoLine;
/** Define a line that has the direction of `l` rotated by `angle` and passes through `p` */
declare function line_rotated_at_point(l: GeoLine, angle: number, p: Vector2): GeoLine;
/**
 * Get a preview diagram of the context
 * @param ctx the Geo context (a dictionary of GeoObj and Vector2)
 * @param pad padding around the diagram (determine how far away from the defined point the visible diagram is)
 */
declare function get_preview_diagram(ctx: GeoCtx, pad?: number[] | number): Diagram;

type geo_construct_GeoCtx = GeoCtx;
type geo_construct_GeoLine = GeoLine;
type geo_construct_GeoObj = GeoObj;
declare const geo_construct_get_preview_diagram: typeof get_preview_diagram;
declare const geo_construct_intersect: typeof intersect;
declare const geo_construct_line: typeof line;
declare const geo_construct_line_from_angle: typeof line_from_angle;
declare const geo_construct_line_from_points: typeof line_from_points;
declare const geo_construct_line_from_slope: typeof line_from_slope;
declare const geo_construct_line_intersection: typeof line_intersection;
declare const geo_construct_line_parallel_at_point: typeof line_parallel_at_point;
declare const geo_construct_line_perpendicular_at_point: typeof line_perpendicular_at_point;
declare const geo_construct_line_rotated_at_point: typeof line_rotated_at_point;
declare const geo_construct_point_collinear_extend_length: typeof point_collinear_extend_length;
declare const geo_construct_point_collinear_fraction: typeof point_collinear_fraction;
declare const geo_construct_point_onLine_atDistance_from: typeof point_onLine_atDistance_from;
declare const geo_construct_point_onLine_with_x: typeof point_onLine_with_x;
declare const geo_construct_point_onLine_with_y: typeof point_onLine_with_y;
declare namespace geo_construct {
  export { type geo_construct_GeoCtx as GeoCtx, type geo_construct_GeoLine as GeoLine, type geo_construct_GeoObj as GeoObj, geo_construct_get_preview_diagram as get_preview_diagram, geo_construct_intersect as intersect, geo_construct_line as line, geo_construct_line_from_angle as line_from_angle, geo_construct_line_from_points as line_from_points, geo_construct_line_from_slope as line_from_slope, geo_construct_line_intersection as line_intersection, geo_construct_line_parallel_at_point as line_parallel_at_point, geo_construct_line_perpendicular_at_point as line_perpendicular_at_point, geo_construct_line_rotated_at_point as line_rotated_at_point, geo_construct_point_collinear_extend_length as point_collinear_extend_length, geo_construct_point_collinear_fraction as point_collinear_fraction, geo_construct_point_onLine_atDistance_from as point_onLine_atDistance_from, geo_construct_point_onLine_with_x as point_onLine_with_x, geo_construct_point_onLine_with_y as point_onLine_with_y };
}

interface TreeNode {
    value: Diagram;
    children?: TreeNode[];
}
/**
 * Create a tree diagram from a tree node
 * @param node root node of the tree
 * @param vertical_dist vertical distance between nodes
 * @param horizontal_gap horizontal gap between nodes
 * @returns tree diagram
 */
declare function tree(node: TreeNode, vertical_dist: number, horizontal_gap: number): Diagram;
/**
 * Mirror a tree node
 * @param node root node of the tree
 * @returns mirrored tree node
 */
declare function mirror_treenode(node: TreeNode): TreeNode;

type shapes_tree_TreeNode = TreeNode;
declare const shapes_tree_mirror_treenode: typeof mirror_treenode;
declare const shapes_tree_tree: typeof tree;
declare namespace shapes_tree {
  export { type shapes_tree_TreeNode as TreeNode, shapes_tree_mirror_treenode as mirror_treenode, shapes_tree_tree as tree };
}

/**
* Combine multiple curves into a single curve
* @param curves an array of curves
* \* you can reverse the order of the point in a curve by using the reverse() method
*/
declare function curve_combine(...curves: Diagram[]): Diagram;
declare function bezier_quadratic(p0: Vector2, p1: Vector2, p2: Vector2, n_sample?: number): Diagram;
declare function bezier_cubic(p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2, n_sample?: number): Diagram;
/**
* Create a curve from the cubic spline interpolation of the given points
* @param points array of points to interpolate
* @param n number of points to interpolate between each pair of points (default 10)
*/
declare function cubic_spline(points: Vector2[], n?: number): Diagram;
/**
 * Cubic spline interpolation
 * @param points array of points to interpolate
 * @param n number of points to interpolate between each pair of points (default 10)
 * @returns array of interpolated points
 */
declare function interpolate_cubic_spline(points: Vector2[], n?: number): Vector2[];

declare const shapes_curves_bezier_cubic: typeof bezier_cubic;
declare const shapes_curves_bezier_quadratic: typeof bezier_quadratic;
declare const shapes_curves_cubic_spline: typeof cubic_spline;
declare const shapes_curves_curve_combine: typeof curve_combine;
declare const shapes_curves_interpolate_cubic_spline: typeof interpolate_cubic_spline;
declare namespace shapes_curves {
  export { shapes_curves_bezier_cubic as bezier_cubic, shapes_curves_bezier_quadratic as bezier_quadratic, shapes_curves_cubic_spline as cubic_spline, shapes_curves_curve_combine as curve_combine, shapes_curves_interpolate_cubic_spline as interpolate_cubic_spline };
}

declare function arrowHead(headsize: number): Diagram;
declare function arrow2(size: number, headsize: number, color: string): Diagram;
declare function verticalLocator(radius?: number, fill?: string, color?: string, headsize?: number): Diagram;
declare function horizontalLocator(radius?: number, fill?: string, color?: string, headsize?: number): Diagram;
declare function spanLocator(radius?: number, fill?: string, color?: string, headsize?: number): Diagram;

declare const shapes_interactive_arrow2: typeof arrow2;
declare const shapes_interactive_arrowHead: typeof arrowHead;
declare const shapes_interactive_horizontalLocator: typeof horizontalLocator;
declare const shapes_interactive_spanLocator: typeof spanLocator;
declare const shapes_interactive_verticalLocator: typeof verticalLocator;
declare namespace shapes_interactive {
  export { shapes_interactive_arrow2 as arrow2, shapes_interactive_arrowHead as arrowHead, shapes_interactive_horizontalLocator as horizontalLocator, shapes_interactive_spanLocator as spanLocator, shapes_interactive_verticalLocator as verticalLocator };
}

declare function encode(s: string): string;
declare function decode(s: string): string;

declare const encoding_decode: typeof decode;
declare const encoding_encode: typeof encode;
declare namespace encoding {
  export { encoding_decode as decode, encoding_encode as encode };
}

export { Content, Diagram, Drawing, Header, Interactive, Paragraph, Path, Quizz, TAG, V2, Vdir, Vector2, _init_default_diagram_style, _init_default_text_diagram_style, _init_default_textdata, align_horizontal, align_vertical, shapes_annotation as annotation, arc, array_repeat, arrow, arrow1, arrow2$1 as arrow2, ax, axes_corner_empty, axes_empty, type axes_options, axes_transform, shapes_bar as bar, boolean, shapes_boxplot as boxplot, circle, clientPos_to_svgPos, curve, shapes_curves as curves, default_diagram_style, default_text_diagram_style, default_textdata, diagram_combine, distribute_grid_row, distribute_horizontal, distribute_horizontal_and_align, distribute_variable_row, distribute_vertical, distribute_vertical_and_align, download_svg_as_png, download_svg_as_svg, draw_to_svg, draw_to_svg_element, type draw_to_svg_options, empty, encoding, filter, geo_construct, shapes_geometry as geometry, get_SVGPos_from_event, get_tagged_svg_element, shapes_graph as graph, handle_tex_in_svg, image, shapes_interactive as interactive, line$1 as line, linspace, linspace_exc, shapes_mechanics as mechanics, modifier as mod, multiline, multiline_bb, shapes_numberline as numberline, plot$1 as plot, plotf, plotv, polygon, range, range_inc, rectangle, rectangle_corner, regular_polygon, regular_polygon_side, reset_default_styles, square, str_latex_to_unicode, str_to_mathematical_italic, shapes_table as table, text, textvar, to_degree, to_radian, transpose, shapes_tree as tree, under_curvef, utils, xaxis, xgrid, xtickmark, xtickmark_empty, xticks, xyaxes, xycorneraxes, xygrid, yaxis, ygrid, ytickmark, ytickmark_empty, yticks };
