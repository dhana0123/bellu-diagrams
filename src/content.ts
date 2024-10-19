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

interface QuizState {
    showSubmit: boolean;
    isExplanationVisible: boolean;
    isExplanationViewed: boolean;
    selectedOptions: Set<number>;
    status: "un-attempt" | "correct" | "wrong";
    remainingAttempts: number;
    disabledOptions: Set<number>;
    answerRevealed: boolean;
}

export class Quiz implements ContentElement {
    id: string = "";
    public readonly type: string = "quiz";
    private questionElements: ContentElement[] = [];
    private options: ContentElement[] = [];
    public element: Element;
    private explanationElements: ContentElement[] = [];
    private callbacks: { [event: string]: Function[] } = {};
    public isMultipleSelection: boolean;
    public hint: string;
    public readonly correctOptions: number[] = []
    private quiz_footer: HTMLDivElement | null = null;

    // State management
    public state: QuizState = {
        showSubmit: true,
        isExplanationVisible: false,
        isExplanationViewed: false,
        selectedOptions: new Set(),
        status: 'un-attempt',
        remainingAttempts: 0,
        disabledOptions: new Set(),
        answerRevealed: false
    };

    constructor(
        questionElements: ContentElement[],
        options: ContentElement[],
        isMultipleSelection: boolean = false,
        explanationElements: ContentElement[] = [],
        hint: string = "",
        correctOptions: number[] = []
    ) {
        this.element = document.createElement('div');
        this.questionElements = questionElements;
        this.options = options;
        this.isMultipleSelection = isMultipleSelection;
        this.hint = hint;
        this.explanationElements = explanationElements;
        this.correctOptions = correctOptions;
        this.initQuizz();
        this.state = {
            ...this.state,
            remainingAttempts: options.length - 1,
        };
    }

    public setState(newState: Partial<QuizState>) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...newState };
        this.updateUI(oldState);
    }

    private updateUI(oldState: QuizState) {
        // Update submit button text
        if (oldState.showSubmit !== this.state.showSubmit) {
            const submitButton = this.element.querySelector(".quiz_submit") as HTMLButtonElement;
            if (submitButton) {
                submitButton.style.display = 'none'
            }
        }

        // Update explanation visibility
        if (oldState.isExplanationVisible !== this.state.isExplanationVisible) {
            const explanationButton = this.element.querySelector(
                ".quiz_explanation_button"
            ) as HTMLButtonElement;
            const explanationContent = this.element.querySelector(
                ".quiz_explanation_content"
            ) as HTMLDivElement;

            if (this.state.isExplanationVisible) {
                explanationButton.textContent = "Hide Explanation";
                explanationContent.style.display = "block";
            } else {
                explanationButton.textContent = "Show Explanation";
                explanationContent.style.display = "none";
            }
        }

        // Update selected options
        if (oldState.selectedOptions !== this.state.selectedOptions) {
            const optionsElement = this.element.querySelector(".quiz_options");

            if (this.state.answerRevealed) return
            if (this.state.status === "correct") return

            if (optionsElement) {
                this.options.forEach((_, index) => {
                    const optionElement = optionsElement.querySelector(
                        `.option_${index + 1}`
                    );
                    const optionContainer = optionsElement.querySelector(
                        `.option_container_${index + 1}`
                    );
                    if (optionContainer && optionElement) {
                        if (this.state.selectedOptions.has(index + 1)) {
                            optionElement.classList.add("selected");
                            optionContainer.classList.add("selected");
                        } else {
                            optionElement.classList.remove("selected");
                            optionContainer.classList.remove("selected");
                        }
                    }
                });
            }
        }

        // upate on answer revalead
        if (oldState.answerRevealed !== this.state.answerRevealed) {
            const optionsElement = this.element.querySelector(".quiz_options");
            if (optionsElement) {
                (this.options || []).map((_, index) => {
                    const optionElement = optionsElement.querySelector(
                        `.option_${index + 1}`
                    );
                    const optionContainer = optionsElement.querySelector(
                        `.option_container_${index + 1}`
                    );
                    if (optionContainer && optionElement) {
                        optionElement.classList.remove("selected");
                        optionContainer.classList.remove("selected");
                    }
                })
            }
        }


        // update the interaction
        if (oldState.status !== this.state.status) {
            const quiz = this.element.closest('.quiz');
            if (quiz) {
                quiz.setAttribute("data-status", this.state.status)
            }
        }
        // Update disabled options
        if (oldState.disabledOptions !== this.state.disabledOptions) {
            const optionsElement = this.element.querySelector(".quiz_options");
            if (optionsElement) {
                this.options.forEach((_, index) => {
                    const optionContainer = optionsElement.querySelector(
                        `.option_container_${index + 1}`
                    );
                    const radio = optionContainer?.querySelector('input');
                    const xMark = optionContainer?.querySelector('.x-mark') as HTMLDivElement;

                    if (optionContainer && radio && xMark) {
                        if (this.state.disabledOptions.has(index + 1)) {
                            optionContainer.classList.add("disabled");
                            radio.style.display = "none";
                            xMark.style.display = "inline-block";
                            radio.disabled = true;
                        }
                    }
                });
            }
        }

        // Highlight correct answer if no more attempts
        if (this.state.remainingAttempts === 0 && this.state.status === "wrong") {
            this.correctOptions.forEach(correctIndex => {
                const optionContainer = this.element.querySelector(
                    `.option_container_${correctIndex}`
                );
                if (optionContainer) {
                    optionContainer.classList.add("correct-answer");
                    // Hide X mark for correct answer when revealed
                    this.setState({ answerRevealed: true })
                    const xMark = optionContainer.querySelector('.x-mark') as HTMLDivElement;
                    if (xMark) {
                        xMark.style.display = "none";
                    }
                }
            });
        }
    }

    private initQuizz() {
        this.addQuestion(this.questionElements);
        this.addOptions();
        this.addHint();
        this.addExplanationContent();
        this.addSubmitButton();
        this.addExplanationButton();
    }

    private addQuestion(elements: ContentElement[]) {
        let questionElement = document.createElement("div");
        questionElement.classList.add("quiz_question");
        questionElement = Content.CombineELements(questionElement, ...elements);
        this.element.appendChild(questionElement);
    }

    private addOptions() {
        const existingOptionsElement = this.element.querySelector(".quiz_options");
        if (existingOptionsElement) {
            this.element.removeChild(existingOptionsElement);
        }

        let optionsElement = document.createElement("div");
        optionsElement.classList.add("quiz_options");

        this.options.forEach((ele, index) => {
            const optionContainer = document.createElement("div");
            optionContainer.classList.add(`option_container`, `option_container_${index + 1}`);

            const radio = document.createElement("input");
            radio.type = this.isMultipleSelection ? "checkbox" : "radio";
            radio.name = `quiz_${this.id}_option`;
            radio.id = `quiz_${this.id}_option_${index + 1}`;
            radio.classList.add("option_input");
            radio.checked = this.state.selectedOptions.has(index + 1);

            // Create X mark element (initially hidden)
            const xMark = document.createElement("span");
            xMark.classList.add("x-mark");
            xMark.innerHTML = "✕"; // Unicode X symbol
            xMark.style.display = "none";

            const label = document.createElement("label");
            label.htmlFor = radio.id;
            label.classList.add("option_label");

            const optionElement = ele.getElement();
            optionElement.classList.add(`option`, `option_${index + 1}`);

            const handleClick = () => this.onOptionClick(index + 1);
            radio.addEventListener("change", handleClick);
            optionContainer.addEventListener("click", (e) => {
                if (e.target !== radio && !this.state.disabledOptions.has(index + 1)) {
                    radio.checked = true;
                    handleClick();
                }
            });

            label.appendChild(radio);
            label.appendChild(xMark);
            label.appendChild(optionElement);
            optionContainer.appendChild(label);

            ele.appendTo(optionContainer);
            optionsElement.appendChild(optionContainer);
        });

        this.element.appendChild(optionsElement);
    }


    private onOptionClick(clickedIndex: number) {
        if (this.state.disabledOptions.has(clickedIndex)) {
            return;
        }

        const newSelectedOptions = new Set(this.state.selectedOptions);

        if (this.isMultipleSelection) {
            if (newSelectedOptions.has(clickedIndex)) {
                newSelectedOptions.delete(clickedIndex);
            } else {
                newSelectedOptions.add(clickedIndex);
            }
        } else {
            newSelectedOptions.clear();
            newSelectedOptions.add(clickedIndex);
        }

        this.setState({ selectedOptions: newSelectedOptions });
        this.emit("selection", Array.from(newSelectedOptions));
    }

    private addExplanationButton() {
        const explanationButton = document.createElement("button");
        explanationButton.textContent = "Show Explanation";
        explanationButton.classList.add("quiz_explanation_button");
        explanationButton.addEventListener("click", () => this.toggleExplanation());
        const quiz_footer = this.getQuizzFooter();
        quiz_footer.appendChild(explanationButton);
    }

    private addExplanationContent() {
        const explanationContent = document.createElement("div");
        explanationContent.classList.add("quiz_explanation_content");
        explanationContent.style.display = "none";
        this.explanationElements.forEach((element) =>
            element.appendTo(explanationContent)
        );
        this.element.appendChild(explanationContent);
    }

    private toggleExplanation() {
        this.setState({
            isExplanationViewed: true,
            showSubmit: false,
            isExplanationVisible: !this.state.isExplanationVisible
        });

        this.emit("explanationToggle", this.state.isExplanationVisible);
    }

    private addHint() {
        if (this.hint) {
            const hintElement = document.createElement("div");
            hintElement.classList.add("quiz_hint");
            hintElement.textContent = `Hint: ${this.hint}`;
            this.element.appendChild(hintElement);
        }
    }

    private addSubmitButton() {
        const submitButton = document.createElement("button");
        submitButton.textContent = "Check";
        const quiz_footer = this.getQuizzFooter();
        submitButton.classList.add("quiz_submit");
        submitButton.addEventListener("click", () => this.onSubmit());
        quiz_footer.appendChild(submitButton);
    }

    private getQuizzFooter() {
        if (!this.quiz_footer) {
            this.quiz_footer = document.createElement("div");
            this.quiz_footer.classList.add('quiz_footer');
            this.element.appendChild(this.quiz_footer);
        }
        return this.quiz_footer;
    }

    private onSubmit() {
        const selectedArray = Array.from(this.state.selectedOptions);
        this.emit("submit", selectedArray);
    }

    public answerIsRight() {
        this.setState({ status: "correct" });
        this.emit("correct")
    }

    public answerIsWrong() {
        this.setState({ status: 'wrong' })
        this.emit("wrong")
    }

    public checkAnswer(showHighlight: boolean = true): boolean {
        const selectedArray = Array.from(this.state.selectedOptions).sort();
        const correctArray = [...this.correctOptions].sort();
        const isCorrect = this.arraysEqual(selectedArray, correctArray);

        if (!isCorrect) {
            // Disable wrong options
            selectedArray.forEach(option => {
                const newDisabledOptions = new Set(this.state.disabledOptions);
                newDisabledOptions.add(option);
                this.setState({
                    disabledOptions: newDisabledOptions,
                    remainingAttempts: this.state.remainingAttempts - 1
                });
            });

            // If no more attempts, show correct answer
            if (this.state.remainingAttempts === 0) {
                this.setState({ showSubmit: false });
                this.answerIsWrong();
            }
        } else {
            this.answerIsRight();
        }

        return isCorrect;
    }

    private arraysEqual(arr1: number[], arr2: number[]): boolean {
        return arr1.length === arr2.length &&
            arr1.every((value, index) => value === arr2[index]);
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
        const quiz = document.createElement("div");
        quiz.classList.add("quiz");
        quiz.setAttribute("data-status", this.state.status)
        this.element.classList.add("quiz_container");
        quiz.appendChild(this.element);
        this.element.id = this.id;
        container.appendChild(quiz);
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
