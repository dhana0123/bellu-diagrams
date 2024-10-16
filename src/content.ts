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

    addHeader(text: string, level: number = 1): string {
        const header = new HeaderElement(text, level);
        return this.addElement(header, "header");
    }

    addParagraph(text: string): string {
        const paragraph = new ParagraphElement(text);
        return this.addElement(paragraph, "paragraph");
    }

    addDrawing(width: number = 100, height: number = 100) {
      const id = this.addSvg(width, height);
      const svg = this.getDrawingElement(id)!
      let draw = (...diagrams:any) => {
          draw_to_svg(svg, diagram_combine(...diagrams));
      };
      let int = new Interactive(this.contentDiv, svg);
      return {draw, int}
    }

    addSvg(width: number = 100, height: number = 100): string {
        const drawing = new DrawingElement(width, height);
        return this.addElement(drawing, "drawing");
    }

    getElement(id: string): ContentElement | undefined {
        return this.elementMap.get(id);
    }
    
    getDomElement(id: string): Element | null {
        const element = this.elementMap.get(id);
        if (element) {
            return this.contentDiv.querySelector(`#${id}`);
        }
        return null; 
    }

    getDrawingElement(drawingId: string): SVGSVGElement | null {
        const element = this.elementMap.get(drawingId);
    
        if(!element) {
           console.error("Svg not found")
          }
        
        if (element instanceof DrawingElement) {
            return this.contentDiv.querySelector(`#${drawingId}`) as SVGSVGElement;
        }
        return null
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

    static fromJSON(json: any, div: HTMLDivElement): Content {
        const content = new Content(div);
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

class HeaderElement implements ContentElement {
    id: string = '';
    constructor(public text: string, public level: number) {}

    appendTo(container: HTMLDivElement): void {
        const header = document.createElement(`h${this.level}`);
        header.id = this.id;
        header.textContent = this.text;
        container.appendChild(header);
    }

    toJSON(): object {
        return { type: 'header', text: this.text, level: this.level };
    }

    static fromJSON(json: any): HeaderElement {
        return new HeaderElement(json.text, json.level);
    }
}

class ParagraphElement implements ContentElement {
    id: string = '';
    constructor(public text: string) {}

    appendTo(container: HTMLDivElement): void {
        const paragraph = document.createElement('p');
        paragraph.id = this.id;
        paragraph.textContent = this.text;
        container.appendChild(paragraph);
    }

    toJSON(): object {
        return { type: 'paragraph', text: this.text };
    }

    static fromJSON(json: any): ParagraphElement {
        return new ParagraphElement(json.text);
    }
}

class DrawingElement implements ContentElement {
    id: string = '';
    constructor(public width: number, public height: number) {}

    appendTo(container: HTMLDivElement): void {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        svg.classList.add("drawing")
        svg.setAttribute("id", this.id);
        svg.setAttribute("width", `${this.width}px`);
        svg.setAttribute("height", `${this.height}px`);
        svg.style.margin = "auto"
        container.appendChild(svg);
    }

    toJSON(): object {
        return { type: 'drawing', width: this.width, height: this.height };
    }

    static fromJSON(json: any): DrawingElement {
        return new DrawingElement(json.width, json.height);
    }
}
