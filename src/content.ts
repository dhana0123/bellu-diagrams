import { diagram_combine } from "./diagram";
import { draw_to_svg } from "./draw_svg";
import { Interactive } from "./html_interactivity";

interface ContentElement {
    id: string;
    appendTo(container: HTMLDivElement): void;
    toJSON(): object;
    getElement(): Element;
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

    addElement(element: ContentElement, type: string) {
        const id = this.generateId(type);
        element.id = id;
        this.elements.push(element);
        this.elementMap.set(id, element);
        element.appendTo(this.contentDiv); // Append directly here
        return this
    }

    header(text: string, level: number = 1): HeaderElement {
        const header = new HeaderElement(text, level);
        this.addElement(header, "header");
        return header; 
    }

    paragraph(text: string): ParagraphElement {
        const paragraph = new ParagraphElement(text);
        this.addElement(paragraph, "paragraph");
        return paragraph; 
    }

    diagram(width: number = 100, height: number = 100): DrawingElement {
        const drawing = new DrawingElement(width, height, this.contentDiv);
        this.addElement(drawing, "drawing");
        return drawing; 
    }
 
    getElement(id: string): ContentElement | undefined {
        return this.elementMap.get(id);
    }

    removeElement(id: string): boolean {
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

    toJSON(): object {
        return {
            elements: this.elements.map(element => ({
                id: element.id,
                ...element.toJSON()
            })),
            nextId: this.nextId
        };
    }

    static fromJSON(json: any, contentDiv: HTMLDivElement): Content {
        const content = new Content(contentDiv);
        content.nextId = json.nextId;
        json.elements.forEach((elementData: any) => {
            let element: ContentElement;
            switch (elementData.type) {
                case 'header':
                    element = HeaderElement.fromJSON(elementData);
                    break;
                case 'paragraph':
                    element = ParagraphElement.fromJSON(elementData);
                    break;
                case 'drawing':
                    element = DrawingElement.fromJSON(elementData, contentDiv);
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

    static CombineELements(parenElement: HTMLDivElement, ...elemeents: ContentElement[]) {
        elemeents.forEach(ele => ele.appendTo(parenElement))
        return parenElement
    }
}

export class DrawingElement implements ContentElement {
    id: string = '';
    private element;
    private callbacks: { [event: string]: Function[] } = {};

    constructor(public width: number, public height: number, private contentDiv: HTMLDivElement) {
        this.contentDiv = contentDiv;
        this.element =  document.createElementNS("http://www.w3.org/2000/svg", 'svg');
    }

    appendTo(container: HTMLDivElement): void {
        this.element.setAttribute("id", this.id);
        this.element.setAttribute("width", `${this.width}px`);
        this.element.setAttribute("height", `${this.height}px`);
        this.element.style.margin = "auto";

        // Attach event listeners (if needed)
        this.attachEventListeners(this.element);

        container.appendChild(this.element);
    }

    init() {
      let draw = (...diagrams:any) => {
          draw_to_svg(this.element, diagram_combine(...diagrams));
      };
      let int = new Interactive(this.contentDiv, this.element);
      return {draw, int}
    }

    
    getElement() {
        return this.element
    }

    private attachEventListeners(svg: SVGSVGElement): void {
        svg.addEventListener('click', () => this.emit('click'));
    }

    emit(eventName: string): void {
        if (this.callbacks[eventName]) {
            this.callbacks[eventName].forEach(callback => callback());
        }
    }

    on(eventName: string, callback: Function): void {
        if (!this.callbacks[eventName]) {
            this.callbacks[eventName] = [];
        }
        this.callbacks[eventName].push(callback);
    }

    toJSON(): object {
        return { type: 'drawing', width: this.width, height: this.height };
    }

    static fromJSON(json: any, contentDiv: HTMLDivElement): DrawingElement {
        return new DrawingElement(json.width, json.height, contentDiv);
    }
}

export class ParagraphElement implements ContentElement {
    id: string = '';
    private element;
    private callbacks: { [event: string]: Function[] } = {};

    constructor(public text: string) {
        this.element = document.createElement('p');
    }


    private attachEventListeners(paragraph: HTMLParagraphElement): void {
        paragraph.addEventListener('click', () => this.emit('click'));
    }

    appendTo(container: HTMLDivElement): void {
        
        this.element.id = this.id;
        this.element.textContent = this.text;

        // Attach event listeners
        this.attachEventListeners(this.element);

        container.appendChild(this.element);
    }

    getElement() {
        return this.element
    }

    emit(eventName: string): void {
        if (this.callbacks[eventName]) {
            this.callbacks[eventName].forEach(callback => callback());
        }
    }

    on(eventName: string, callback: Function): void {
        if (!this.callbacks[eventName]) {
            this.callbacks[eventName] = [];
        }
        this.callbacks[eventName].push(callback);
    }

    toJSON(): object {
        return { type: 'paragraph', text: this.text };
    }

    static fromJSON(json: any): ParagraphElement {
        return new ParagraphElement(json.text);
    }
}


export class HeaderElement implements ContentElement {
    id: string = '';
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
        return this.element
    }

    private attachEventListeners(header: HTMLElement): void {
        header.addEventListener('click', () => this.emit('click'));
    }

    emit(eventName: string): void {
        if (this.callbacks[eventName]) {
            this.callbacks[eventName].forEach(callback => callback());
        }
    }

    on(eventName: string, callback: Function): void {
        if (!this.callbacks[eventName]) {
            this.callbacks[eventName] = [];
        }
        this.callbacks[eventName].push(callback);
    }

    toJSON(): object {
        return { type: 'header', text: this.text, level: this.level };
    }

    static fromJSON(json: any): HeaderElement {
        return new HeaderElement(json.text, json.level);
    }
}

export class Quizz implements ContentElement {
    private questionElements: ContentElement[] = []
    private options: ContentElement[] = [];
    public element: Element;
    private selectedOptions: Set<number> = new Set();
    private explanationElements: ContentElement[] = [];
    private callbacks: { [event: string]: Function[] } = {};
    id: string = ""
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
        this.element = document.createElement("div")
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
        if(existingOptionsElement) {
            this.element.removeChild(existingOptionsElement);
        }

        let optionsElement = document.createElement("div");
        optionsElement.classList.add("quizz_options");
        
        this.options.forEach((ele, index) => {
            const optionElement = ele.getElement();
            optionElement.classList.add(`option`, `option_${index+1}`);
            if(this.selectedOptions.has(index + 1)) {
                optionElement.classList.add('selected');
            } else {
                optionElement.classList.remove('selected');
            }
            optionElement.addEventListener('click', () => this.onOptionClick(index + 1));
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
        this.emit('selection', Array.from(this.selectedOptions));
    }

    private updateOptionSelections() {
        const optionsElement = this.element.querySelector(".quizz_options");
        if (optionsElement) {
            this.options.forEach((_, index) => {
                const optionElement = optionsElement.querySelector(`.option_${index+1}`);
                if (optionElement) {
                    if (this.selectedOptions.has(index + 1)) {
                        optionElement.classList.add('selected');
                    } else {
                        optionElement.classList.remove('selected');
                    }
                }
            });
        }
    }

    private addExplanationButton() {
        const explanationButton = document.createElement("button");
        explanationButton.textContent = "Show Explanation";
        explanationButton.classList.add("quizz_explanation_button");
        explanationButton.addEventListener('click', () => this.toggleExplanation());
        this.element.appendChild(explanationButton);

        const explanationContent = document.createElement("div");
        explanationContent.classList.add("quizz_explanation_content");
        explanationContent.style.display = "none";
        this.explanationElements.forEach(element => element.appendTo(explanationContent));
        this.element.appendChild(explanationContent);
    }

    private toggleExplanation() {
        this.isExplanationVisible = !this.isExplanationVisible;
        const explanationButton = this.element.querySelector(".quizz_explanation_button") as HTMLButtonElement;
        const explanationContent = this.element.querySelector(".quizz_explanation_content") as HTMLDivElement;

        if (this.isExplanationVisible) {
            explanationButton.textContent = "Hide Explanation";
            explanationContent.style.display = "block";
        } else {
            explanationButton.textContent = "Show Explanation";
            explanationContent.style.display = "none";
        }

        this.emit('explanationToggle', this.isExplanationVisible);
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
        submitButton.addEventListener('click', () => this.onSubmit());
        this.element.appendChild(submitButton);
    }

    private onSubmit() {
        const selectedArray = Array.from(this.selectedOptions);
        this.emit('submit', selectedArray);
    }

    emit(eventName: string, data?: any): void {
        if (this.callbacks[eventName]) {
            this.callbacks[eventName].forEach(callback => callback(data));
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

    toJSON(): object {
        return { 
            type: 'quizz',
            isMultipleSelection: this.isMultipleSelection,
            hint: this.hint,
            selectedOptions: Array.from(this.selectedOptions)
        };
    }
}