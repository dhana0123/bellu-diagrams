import { diagram_combine } from "./diagram";
import { draw_to_svg } from "./draw_svg";
import { Interactive } from "./html_interactivity";

interface ContentElement {
    id: string;
    appendTo(container: HTMLDivElement): void;
    toJSON(): object;
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

    private addElement(element: ContentElement, type: string): string {
        const id = this.generateId(type);
        element.id = id;
        this.elements.push(element);
        this.elementMap.set(id, element);
        element.appendTo(this.contentDiv); // Append directly here
        return id;
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


