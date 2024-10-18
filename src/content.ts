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
interface ContentElement {
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

    constructor(public title: string, public url: string, public width: number, public height?: number) {
        this.element = document.createElement("div");
        this.element.classList.add("banner")
        this.element.id = this.id;
    }

    appendTo(container: HTMLDivElement): void {
        const bannerContainer = document.createElement("div")
        bannerContainer.classList.add("banner_container")
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

export class Quiz implements ContentElement {
    id: string = "";
    public readonly type: string = "quiz";
    private questionElements: ContentElement[] = [];
    private options: ContentElement[] = [];
    public element: Element;
    private selectedOptions: Set<number> = new Set();
    private explanationElements: ContentElement[] = [];
    private callbacks: { [event: string]: Function[] } = {};
    private isMultipleSelection: boolean;
    private hint: string;
    private isExplanationVisible: boolean = false;

    constructor(
        questionElements: ContentElement[],
        options: ContentElement[],
        isMultipleSelection: boolean = false,
        hint: string = "",
        explanationElements: ContentElement[] = []
    ) {
        this.element = document.createElement("div");
        this.questionElements = questionElements;
        this.options = options;
        this.isMultipleSelection = isMultipleSelection;
        this.hint = hint;
        this.explanationElements = explanationElements;
        this.initQuizz();
    }
    private initQuizz() {
        this.addQuestion(this.questionElements);
        this.addOptions();
        this.addHint();
        this.addExplanationButton();
        this.addSubmitButton();
    }

    private addQuestion(elements: ContentElement[]) {
        let questionElement = document.createElement("div");
        questionElement.classList.add("quizz_question");
        questionElement = Content.CombineELements(questionElement, ...elements);
        this.element.appendChild(questionElement);
    }

    private addOptions() {
        const existingOptionsElement = this.element.querySelector(".quizz_options");
        if (existingOptionsElement) {
            this.element.removeChild(existingOptionsElement);
        }

        let optionsElement = document.createElement("div");
        optionsElement.classList.add("quizz_options");

        this.options.forEach((ele, index) => {
            const optionElement = ele.getElement();
            optionElement.classList.add(`option`, `option_${index + 1}`);
            if (this.selectedOptions.has(index + 1)) {
                optionElement.classList.add("selected");
            } else {
                optionElement.classList.remove("selected");
            }
            optionElement.addEventListener("click", () =>
                this.onOptionClick(index + 1)
            );
            ele.appendTo(optionsElement);
        });

        this.element.appendChild(optionsElement);
    }

    private onOptionClick(clickedIndex: number) {
        if (this.isMultipleSelection) {
            if (this.selectedOptions.has(clickedIndex)) {
                this.selectedOptions.delete(clickedIndex);
            } else {
                this.selectedOptions.add(clickedIndex);
            }
        } else {
            this.selectedOptions.clear();
            this.selectedOptions.add(clickedIndex);
        }
        this.updateOptionSelections();
        this.emit("selection", Array.from(this.selectedOptions));
    }

    private updateOptionSelections() {
        const optionsElement = this.element.querySelector(".quizz_options");
        if (optionsElement) {
            this.options.forEach((_, index) => {
                const optionElement = optionsElement.querySelector(
                    `.option_${index + 1}`
                );
                if (optionElement) {
                    if (this.selectedOptions.has(index + 1)) {
                        optionElement.classList.add("selected");
                    } else {
                        optionElement.classList.remove("selected");
                    }
                }
            });
        }
    }

    private addExplanationButton() {
        const explanationButton = document.createElement("button");
        explanationButton.textContent = "Show Explanation";
        explanationButton.classList.add("quizz_explanation_button");
        explanationButton.addEventListener("click", () => this.toggleExplanation());
        this.element.appendChild(explanationButton);

        const explanationContent = document.createElement("div");
        explanationContent.classList.add("quizz_explanation_content");
        explanationContent.style.display = "none";
        this.explanationElements.forEach((element) =>
            element.appendTo(explanationContent)
        );
        this.element.appendChild(explanationContent);
    }

    private toggleExplanation() {
        this.isExplanationVisible = !this.isExplanationVisible;
        const explanationButton = this.element.querySelector(
            ".quizz_explanation_button"
        ) as HTMLButtonElement;
        const explanationContent = this.element.querySelector(
            ".quizz_explanation_content"
        ) as HTMLDivElement;

        if (this.isExplanationVisible) {
            explanationButton.textContent = "Hide Explanation";
            explanationContent.style.display = "block";
        } else {
            explanationButton.textContent = "Show Explanation";
            explanationContent.style.display = "none";
        }

        this.emit("explanationToggle", this.isExplanationVisible);
    }

    private addHint() {
        if (this.hint) {
            const hintElement = document.createElement("div");
            hintElement.classList.add("quizz_hint");
            hintElement.textContent = `Hint: ${this.hint}`;
            this.element.appendChild(hintElement);
        }
    }

    private addSubmitButton() {
        const submitButton = document.createElement("button");
        submitButton.textContent = "Submit";
        submitButton.classList.add("quizz_submit");
        submitButton.addEventListener("click", () => this.onSubmit());
        this.element.appendChild(submitButton);
    }

    private onSubmit() {
        const selectedArray = Array.from(this.selectedOptions);
        this.emit("submit", selectedArray);
    }

    emit(eventName: string, data?: any): void {
        if (this.callbacks[eventName]) {
            this.callbacks[eventName].forEach((callback) => callback(data));
        }
    }

    on(eventName: string, callback: Function): void {
        if (!this.callbacks[eventName]) {
            this.callbacks[eventName] = [];
        }
        this.callbacks[eventName].push(callback);
    }

    getElement(): Element {
        return this.element;
    }

    appendTo(container: HTMLDivElement): void {
        this.element.id = this.id;
        this.element.classList.add("quizz");
        container.appendChild(this.element);
    }

    getSubElements(): ContentElement[] {
        return [
            ...this.questionElements,
            ...this.options,
            ...this.explanationElements,
        ];
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

export class InputQuiz implements ContentElement {
    id: string = "";
    public readonly type: string = "input_quiz";
    private questionElements: ContentElement[] = [];
    public element: Element;
    private inputElement: HTMLInputElement;
    private explanationElements: ContentElement[] = [];
    private callbacks: { [event: string]: Function[] } = {};
    private hint: string;
    private isExplanationVisible: boolean = false;

    constructor(
        questionElements: ContentElement[],
        hint: string = "",
        explanationElements: ContentElement[] = []
    ) {
        this.element = document.createElement("div");
        this.questionElements = questionElements;
        this.hint = hint;
        this.explanationElements = explanationElements;
        this.inputElement = document.createElement("input");
        this.inputElement.type = "text";
        this.initQuiz();
    }

    private initQuiz() {
        this.addQuestion(this.questionElements);
        this.addInputField();
        this.addHint();
        this.addExplanationButton();
        this.addSubmitButton();
    }

    private addQuestion(elements: ContentElement[]) {
        let questionElement = document.createElement("div");
        questionElement.classList.add("input_quiz_question");
        questionElement = Content.CombineELements(questionElement, ...elements);
        this.element.appendChild(questionElement);
    }

    private addInputField() {
        this.inputElement.classList.add("input_quiz_input");
        this.element.appendChild(this.inputElement);
    }

    private addHint() {
        if (this.hint) {
            const hintElement = document.createElement("div");
            hintElement.classList.add("input_quiz_hint");
            hintElement.textContent = `Hint: ${this.hint}`;
            this.element.appendChild(hintElement);
        }
    }

    private addExplanationButton() {
        const explanationButton = document.createElement("button");
        explanationButton.textContent = "Show Explanation";
        explanationButton.classList.add("input_quiz_explanation_button");
        explanationButton.addEventListener("click", () => this.toggleExplanation());
        this.element.appendChild(explanationButton);

        const explanationContent = document.createElement("div");
        explanationContent.classList.add("input_quiz_explanation_content");
        explanationContent.style.display = "none";
        this.explanationElements.forEach((element) =>
            element.appendTo(explanationContent)
        );
        this.element.appendChild(explanationContent);
    }

    private toggleExplanation() {
        this.isExplanationVisible = !this.isExplanationVisible;
        const explanationButton = this.element.querySelector(
            ".input_quiz_explanation_button"
        ) as HTMLButtonElement;
        const explanationContent = this.element.querySelector(
            ".input_quiz_explanation_content"
        ) as HTMLDivElement;

        if (this.isExplanationVisible) {
            explanationButton.textContent = "Hide Explanation";
            explanationContent.style.display = "block";
        } else {
            explanationButton.textContent = "Show Explanation";
            explanationContent.style.display = "none";
        }

        this.emit("explanationToggle", this.isExplanationVisible);
    }

    private addSubmitButton() {
        const submitButton = document.createElement("button");
        submitButton.textContent = "Submit";
        submitButton.classList.add("input_quiz_submit");
        submitButton.addEventListener("click", () => this.onSubmit());
        this.element.appendChild(submitButton);
    }

    private onSubmit() {
        const inputValue = this.inputElement.value;
        this.emit("submit", inputValue);
    }

    emit(eventName: string, data?: any): void {
        if (this.callbacks[eventName]) {
            this.callbacks[eventName].forEach((callback) => callback(data));
        }
    }

    on(eventName: string, callback: Function): void {
        if (!this.callbacks[eventName]) {
            this.callbacks[eventName] = [];
        }
        this.callbacks[eventName].push(callback);
    }

    getElement(): Element {
        return this.element;
    }

    appendTo(container: HTMLDivElement): void {
        this.element.id = this.id;
        this.element.classList.add("input_quiz");
        container.appendChild(this.element);
    }

    getSubElements(): ContentElement[] {
        return [...this.questionElements, ...this.explanationElements];
    }
}
