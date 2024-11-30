import katex from "katex";
import * as marked from "marked";
import { diagram_combine } from "./diagram";
import { draw_to_svg } from "./draw_svg";
import { Interactive } from "./html_interactivity";

/**
 * content elements are muatable
 * becuase dom itself inhernetly mutable
 *
 */
export interface ContentElement {
    id: string;
    type: string;
    appendTo(container: HTMLDivElement): void;
    getElement(): Element;
    getSubElements?(): ContentElement[];
}

export class Content {
    private elements: ContentElement[] = [];
    private elementMap: Map<string, ContentElement> = new Map();
    private nextId: number = 1;
    private contentDiv: HTMLDivElement;

    constructor(contentDiv: HTMLDivElement) {
        this.contentDiv = contentDiv;
    }

    private generateId(type: string): string {
        return `${type}_${this.nextId++}`;
    }

    add(element: ContentElement) {
        this.addElementRecursively(element);
        element.appendTo(this.contentDiv);
        return this;
    }

    private addElementRecursively(element: ContentElement) {
        if (!element.id) {
            element.id = this.generateId(element.type);
        }
        this.elementMap.set(element.id, element);
        this.elements.push(element);
        if (element.getSubElements) {
            element.getSubElements().forEach((subElement) => {
                this.addElementRecursively(subElement);
            });
        }
    }

    getAllElements() {
        return this.elements;
    }

    getElement(id: string): ContentElement | undefined {
        return this.elementMap.get(id);
    }

    static CombineELements(
        parenElement: HTMLDivElement,
        ...elemeents: ContentElement[]
    ) {
        elemeents.forEach((ele) => ele.appendTo(parenElement));
        return parenElement;
    }
}

export class Drawing implements ContentElement {
    id: string = "";
    public readonly type: string = "drawing";
    private element;
    public drawingContainer: HTMLDivElement | null = null;
    private callbacks: { [event: string]: Function[] } = {};
    constructor(public width: number, public height: number) {
        this.element = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );
    }

    appendTo(container: HTMLDivElement): void {
        this.element.setAttribute("id", this.id);
        this.element.setAttribute("width", `${this.width}px`);
        this.element.setAttribute("height", `${this.height}px`);
        this.element.style.margin = "auto";

        const drawingContainer = document.createElement("div");
        drawingContainer.classList.add("diagram_container");
        drawingContainer.appendChild(this.element);
        // Attach event listeners (if needed)
        this.attachEventListeners(this.element);
        this.drawingContainer = drawingContainer;
        container.appendChild(drawingContainer);
    }

    init() {
        if (!this.drawingContainer) {
            console.error("drawingContainer of drawing on initalized yet.");
            return;
        }
        let draw = (...diagrams: any) => {
            draw_to_svg(this.element, diagram_combine(...diagrams));
        };
        let int = new Interactive(this.drawingContainer, this.element);
        return { draw, int };
    }

    getElement() {
        return this.element;
    }

    private attachEventListeners(svg: SVGSVGElement): void {
        svg.addEventListener("click", () => this.emit("click"));
    }

    emit(eventName: string): void {
        if (this.callbacks[eventName]) {
            this.callbacks[eventName].forEach((callback) => callback());
        }
    }

    on(eventName: string, callback: Function): void {
        if (!this.callbacks[eventName]) {
            this.callbacks[eventName] = [];
        }
        this.callbacks[eventName].push(callback);
    }
}

export class Paragraph implements ContentElement {
    id: string = "";
    public readonly type: string = "paragraph";
    private element;
    private callbacks: { [event: string]: Function[] } = {};

    constructor(public text: string) {
        this.element = document.createElement("p");
    }

    private attachEventListeners(paragraph: HTMLParagraphElement): void {
        paragraph.addEventListener("click", () => this.emit("click"));
    }

    appendTo(container: HTMLDivElement): void {
        this.element.id = this.id;
        this.element.classList.add("paragraph")
        this.element.textContent = this.text;

        // Attach event listeners
        this.attachEventListeners(this.element);

        container.appendChild(this.element);
    }

    getElement() {
        return this.element;
    }

    emit(eventName: string): void {
        if (this.callbacks[eventName]) {
            this.callbacks[eventName].forEach((callback) => callback());
        }
    }

    on(eventName: string, callback: Function): void {
        if (!this.callbacks[eventName]) {
            this.callbacks[eventName] = [];
        }
        this.callbacks[eventName].push(callback);
    }
}

export class Header implements ContentElement {
    id: string = "";
    public readonly type: string = "header";
    private element;
    private callbacks: { [event: string]: Function[] } = {};

    constructor(public text: string, public level: number) {
        this.element = document.createElement(`h${this.level}`);
    }

    appendTo(container: HTMLDivElement): void {
        this.element.id = this.id;
        this.element.textContent = this.text;

        // Attach event listeners
        this.attachEventListeners(this.element);

        container.appendChild(this.element);
    }

    getElement() {
        return this.element;
    }

    private attachEventListeners(header: HTMLElement): void {
        header.addEventListener("click", () => this.emit("click"));
    }

    emit(eventName: string): void {
        if (this.callbacks[eventName]) {
            this.callbacks[eventName].forEach((callback) => callback());
        }
    }

    on(eventName: string, callback: Function): void {
        if (!this.callbacks[eventName]) {
            this.callbacks[eventName] = [];
        }
        this.callbacks[eventName].push(callback);
    }
}


export class Banner implements ContentElement {
    id: string = ""
    public readonly type: string = "banner"
    private element: HTMLDivElement;

    constructor(public title: string, public url: string, public color: string, public width: number, public height?: number,) {
        this.element = document.createElement("div");
        this.element.classList.add("banner")
        this.element.id = this.id;
    }

    appendTo(container: HTMLDivElement): void {
        const bannerContainer = document.createElement("div")
        bannerContainer.classList.add("banner_container")
        bannerContainer.style.background = `linear-gradient(to bottom, ${this.color}ff, ${this.color}00)`
        const image = document.createElement("img")
        image.classList.add("banner_image")
        image.src = this.url;
        image.width = this.width
        if (this.height) {
            image.height = this.height
        }
        const title = document.createElement("h1")
        title.classList.add("banner_title")
        title.innerText = this.title

        bannerContainer.appendChild(image)
        bannerContainer.appendChild(title)
        this.element.appendChild(bannerContainer)

        container.appendChild(this.element)
    }

    getElement() {
        return this.element;
    }

}



export class Markup implements ContentElement {
    id: string = "";
    public readonly type: string = "markup";
    private element: HTMLDivElement;
    private callbacks: { [event: string]: Function[] } = {};

    constructor(public content: string) {
        this.element = document.createElement("div");
        this.element.id = this.id;
        this.element.classList.add("markup-content");
    }

    appendTo(container: HTMLDivElement): void {
        // Process the content
        const processedContent = this.processContent(this.content);
        this.element.innerHTML = processedContent;

        // Attach event listeners
        this.attachEventListeners(this.element);

        container.appendChild(this.element);
    }

    getElement(): Element {
        return this.element;
    }

    private attachEventListeners(element: HTMLDivElement): void {
        element.addEventListener("click", () => this.emit("click"));
    }

    private processContent(content: string): string {
        // First, parse the content using Marked for Markdown
        const parsedMarkdown = marked.parse(content) as string;

        // Then, process KaTeX expressions in the parsed Markdown
        const parts = parsedMarkdown.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/);

        const converted = parts
            .map((part) => {
                if (part.startsWith("$$") && part.endsWith("$$")) {
                    // KaTeX block rendering
                    return katex.renderToString(part.slice(2, -2), {
                        displayMode: true,
                        output: "mathml",
                    });
                } else if (part.startsWith("$") && part.endsWith("$")) {
                    // KaTeX inline rendering
                    return katex.renderToString(part.slice(1, -1), {
                        displayMode: false,
                        output: "mathml",
                    });
                } else {
                    // Return normal Markdown (already parsed)
                    return part;
                }
            })
            .join("");
        return converted;
    }

    emit(eventName: string): void {
        if (this.callbacks[eventName]) {
            this.callbacks[eventName].forEach((callback) => callback());
        }
    }

    on(eventName: string, callback: Function): void {
        if (!this.callbacks[eventName]) {
            this.callbacks[eventName] = [];
        }
        this.callbacks[eventName].push(callback);
    }
}


export class Image implements ContentElement {
    type: string = "image";
    id: string = "";
    element: HTMLImageElement;
    constructor(public src: string, public width: number, public height?: number) {
        this.element = document.createElement("img");
    }

    appendTo(container: HTMLDivElement): void {
        this.element.src = this.src;
        this.element.width = this.width;
        this.element.classList.add("img")
        const img_container = document.createElement("div")
        img_container.classList.add("img_container")
        if (this.height) {
            this.element.height = this.height
        }
        img_container.appendChild(this.element)
        container.appendChild(img_container)
    }

    getElement(): Element {
        return this.element;
    }
}