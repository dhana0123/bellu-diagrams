import { Content, ContentElement } from "./content"

export abstract class ReactiveElement<TState extends object> {
    protected subscribers: Map<string, Set<(value: any) => void>> = new Map();
    protected state!: TState;

    protected createState(initialState: TState): TState {
        return new Proxy(initialState, {
            set: (target: any, property: string, value: any) => {
                const oldValue = target[property];
                target[property] = value;

                if (oldValue !== value && this.subscribers.has(property)) {
                    this.subscribers.get(property)?.forEach(callback => callback(value));
                }
                return true;
            }
        });
    }

    protected setState<K extends keyof TState>(state: Pick<TState, K>) {
        Object.keys(state).forEach(key => {
            this.state[key as K] = state[key as K];
        });

        console.warn(Object.entries(this.state), "--state")
    }

    subscribe(property: string, callback: (value: any) => void) {
        if (!this.subscribers.has(property)) {
            this.subscribers.set(property, new Set());
        }
        this.subscribers.get(property)?.add(callback);
    }

    unsubscribe(property: string, callback: (value: any) => void) {
        this.subscribers.get(property)?.delete(callback);
    }

    emit(eventName: string, data?: any): void {
        if (this.subscribers.has(eventName)) {
            this.subscribers.get(eventName)?.forEach(callback => callback(data));
        }
    }

    on(eventName: string, callback: Function): void {
        this.subscribe(eventName, callback as (value: any) => void);
    }
}

interface QuizState {
    showSubmit: boolean;
    showExplanation: boolean;
    isExplanationViewed: boolean;
    isMultipleSelection: boolean;
    selectedOptions: Set<number>;
    correctOptions: number[];
    optionType: OptionType;
    status: "un-attempt" | "correct" | "wrong" | "completed";
    disabledOptions: Set<number>;
    isAnswerRevealed: boolean;
    showHint: boolean;
    hint: string;
    questionElements: ContentElement[];
    explanationElements: ContentElement[];
    optionsElements: ContentElement[];
}

type OptionType = "grid" | "list"

export class Quiz extends ReactiveElement<QuizState> implements ContentElement {
    id: string = "";
    public readonly type: string = "quiz";
    public element: Element;
    private quiz_footer: HTMLDivElement | null = null;

    constructor(
        status: QuizState['status'],
        optionType: OptionType,
        questionElements: ContentElement[],
        optionsElements: ContentElement[],
        isMultipleSelection: boolean = false,
        explanationElements: ContentElement[] = [],
        correctOptions: number[] = [],
    ) {
        super();
        this.element = document.createElement('div'),
            this.state = this.createState({
                questionElements: questionElements,
                optionsElements: optionsElements,
                isMultipleSelection: isMultipleSelection,
                explanationElements: explanationElements,
                correctOptions: correctOptions,
                optionType: optionType,
                showSubmit: status !== "completed",
                status: status,
                selectedOptions: new Set(),
                showExplanation: false,
                isAnswerRevealed: false,
                showHint: false,
                hint: "",
                disabledOptions: new Set(),
                isExplanationViewed: false,
            })
        this.initQuizz();
        this.setupQuizClickHandler();
    }

    private static readonly SELECTORS = {
        QUIZ: "quiz",
        QUESTION: "quiz_question",
        SUBMIT: "quiz_submit",
        OPTIONS: "quiz_options",
        OPTION: (index: number) => `option_${index}`,
        OPTION_CONTAINER: (index: number) => `option_container_${index}`,
        X_MARK: "x-mark",
        EXPLANATION_BUTTON: "quiz_explanation_button",
        EXPLANATION_CONTENT: "quiz_explanation_content",
        RESET_BUTTON: "quiz_reset",
        HINT: "quiz_hint"
    }

    private initQuizz() {
        this.renderQuestions();
        this.renderOptions();
        this.renderHint();
        this.renderExplanation();
        this.renderSubmitButton();
        this.renderExplanationButton();
        this.renderResetButton();

        // Set up reactive subscriptions
        this.subscribe('showSubmit', (value) => this.onShowSubmitChange(value));
        this.subscribe('showExplanation', (value) => this.onShowExplanationChange(value));
        this.subscribe("selectedOptions", (value) => this.onSelectedOptionsChange(value))
        this.subscribe("isAnswerRevealed", (value) => this.onIsAnswerReaveledChange(value))
        this.subscribe("disabledOptions", (value) => this.onDisabledOptionsChange(value));
        this.subscribe("status", (value) => this.onStatusChange(value));
        this.subscribe("showHint", (value) => this.onShowHintChange(value))
    }


    private renderQuestions() {
        let questionElement = document.createElement("div");
        questionElement.classList.add(Quiz.SELECTORS.QUESTION);
        questionElement = Content.CombineELements(questionElement, ...this.state.questionElements);
        this.element.appendChild(questionElement);
    }

    private renderOptions() {
        const existingOptionsElement = this.element.querySelector(`.${Quiz.SELECTORS.OPTIONS}`);
        if (existingOptionsElement) {
            this.element.removeChild(existingOptionsElement);
        }

        let optionsElement = document.createElement("div");
        optionsElement.classList.add(Quiz.SELECTORS.OPTIONS);
        optionsElement.setAttribute(`data-type`, this.state.optionType)

        let isCompleted = this.state.status === "completed"

        this.state.optionsElements.forEach((ele, index) => {
            const optionContainer = document.createElement("div");
            optionContainer.classList.add(`option_container`, `option_container_${index + 1}`);
            const radio = document.createElement("input");
            radio.type = this.state.isMultipleSelection ? "checkbox" : "radio";
            radio.name = `quiz_${this.id}_option`;
            radio.id = `quiz_${this.id}_option_${index + 1}`;
            radio.classList.add("option_input");
            radio.checked = isCompleted ? false : this.state.selectedOptions.has(index + 1);
            radio.disabled = isCompleted


            // Create X mark element (initially hidden)
            const xMark = document.createElement("span");
            xMark.classList.add(Quiz.SELECTORS.X_MARK);
            xMark.innerHTML = "✕"; // Unicode X symbol
            xMark.style.display = "none";

            const label = document.createElement("label");
            label.htmlFor = radio.id;
            label.classList.add("option_label");

            const optionElement = ele.getElement();
            optionElement.classList.add(`option`, `option_${index + 1}`);

            if (isCompleted) {
                if (this.state.correctOptions.includes(index + 1)) {
                    optionContainer.classList.add("selected")
                } else {
                    optionContainer.classList.add("disabled")
                }
            } else {
                const handleClick = () => this.onOptionClick(index + 1);
                optionContainer.addEventListener("click", (e) => {
                    if (e.target !== radio && !this.state.disabledOptions.has(index + 1)) {
                        radio.checked = true;
                        handleClick();
                    }
                });
                radio.addEventListener('change', () => {
                    if (!this.state.disabledOptions.has(index + 1)) {
                        handleClick();
                    }
                });
            }

            label.appendChild(radio);
            label.appendChild(xMark);
            label.appendChild(optionElement);
            optionContainer.appendChild(label);

            ele.appendTo(optionContainer);
            optionsElement.appendChild(optionContainer);
        });

        this.element.appendChild(optionsElement);
    }

    private renderExplanationButton() {
        const explanationButton = document.createElement("button");
        explanationButton.textContent = "Show Explanation";
        explanationButton.classList.add(Quiz.SELECTORS.EXPLANATION_BUTTON);
        explanationButton.addEventListener("click", () => this.toggleExplanation());
        const quiz_footer = this.getQuizzFooter();
        quiz_footer.appendChild(explanationButton);
    }

    private renderExplanation() {
        const explanationContent = document.createElement("div");
        explanationContent.classList.add(Quiz.SELECTORS.EXPLANATION_CONTENT);
        explanationContent.style.display = this.state.isExplanationViewed ? "block" : "none";
        this.state.explanationElements.forEach((element) =>
            element.appendTo(explanationContent)
        );
        this.element.appendChild(explanationContent);
    }

    private renderHint() {
        const hintElement = document.createElement("div");
        hintElement.classList.add(Quiz.SELECTORS.HINT);
        hintElement.style.display = this.state.showHint ? "block" : "none";
        this.element.appendChild(hintElement);
    }

    private renderSubmitButton() {
        const submitButton = document.createElement("button");
        submitButton.textContent = "Check";
        const quiz_footer = this.getQuizzFooter();
        submitButton.style.display = this.state.showSubmit ? "block" : "none";
        submitButton.classList.add(Quiz.SELECTORS.SUBMIT);
        submitButton.addEventListener("click", () => this.onSubmit());
        quiz_footer.appendChild(submitButton);
    }

    private renderResetButton() {
        const resetButton = document.createElement("button");
        resetButton.textContent = "Reset";
        resetButton.classList.add(Quiz.SELECTORS.RESET_BUTTON);

        resetButton.addEventListener("click", () => {
            this.setState({
                showSubmit: true,
                showExplanation: false,
                isExplanationViewed: false,
                selectedOptions: new Set<number>(),
                status: 'un-attempt',
                disabledOptions: new Set<number>(),
                isAnswerRevealed: false,
                showHint: false,
                hint: ""
            });
            this.clearDisableOptions()
        });

        const quiz_footer = this.getQuizzFooter();
        quiz_footer.appendChild(resetButton);
    }


    private toggleExplanation() {
        this.setState({
            isExplanationViewed: true,
            showSubmit: false,
            showExplanation: !this.state.showExplanation
        });

        this.emit("explanationToggle", this.state.showExplanation);
    }

    private clearDisableOptions() {
        const optionsElement = this.element.querySelector(`.${Quiz.SELECTORS.OPTIONS}`);
        if (optionsElement) {
            this.state.optionsElements.forEach((_, index) => {
                const optionContainer = optionsElement.querySelector(
                    `.${Quiz.SELECTORS.OPTION_CONTAINER(index + 1)}`
                );
                const radio = optionContainer?.querySelector('input');
                const xMark = optionContainer?.querySelector(`.${Quiz.SELECTORS.X_MARK}`) as HTMLDivElement;

                if (optionContainer && radio && xMark) {
                    optionContainer.classList.remove("disabled");
                    radio.style.display = "inline-block";
                    radio.checked = false
                    xMark.style.display = "none";
                    radio.disabled = true;

                }
            });
        }
    }

    private onShowSubmitChange(showSubmit: boolean) {
        const submitButton = this.element.querySelector(`.${Quiz.SELECTORS.SUBMIT}`) as HTMLButtonElement;
        if (submitButton) {
            submitButton.style.display = showSubmit ? "display" : "none"
        }
    }

    private onShowExplanationChange(isExplanationViewed: boolean) {
        const explanationButton = this.element.querySelector(
            `.${Quiz.SELECTORS.EXPLANATION_BUTTON}`
        ) as HTMLButtonElement;
        const explanationContent = this.element.querySelector(
            `.${Quiz.SELECTORS.EXPLANATION_CONTENT}`
        ) as HTMLDivElement;

        if (isExplanationViewed) {
            explanationButton.textContent = "Hide Explanation";
            explanationContent.style.display = "block";
        } else {
            explanationButton.textContent = "Show Explanation";
            explanationContent.style.display = "none";
        }
    }

    private onSelectedOptionsChange(selectedOptions: Set<number>) {
        const optionsElement = this.element.querySelector(`.${Quiz.SELECTORS.OPTIONS}`);

        if (this.state.isAnswerRevealed) return
        if (this.state.status === "correct" || this.state.status === "completed") return

        if (optionsElement) {
            this.state.optionsElements.forEach((_, index) => {
                const optionElement = optionsElement.querySelector(
                    `.${Quiz.SELECTORS.OPTION(index + 1)}`
                );
                const optionContainer = optionsElement.querySelector(
                    `.${Quiz.SELECTORS.OPTION_CONTAINER(index + 1)}`
                );
                if (optionContainer && optionElement) {
                    if (selectedOptions.has(index + 1)) {
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

    private onIsAnswerReaveledChange(isAnswerRevealed: boolean) {
        const optionsElement = this.element.querySelector(`.${Quiz.SELECTORS.OPTIONS}`);
        if (optionsElement) {
            (this.state.optionsElements || []).map((_, index) => {
                const optionElement = optionsElement.querySelector(
                    `.${Quiz.SELECTORS.OPTION(index + 1)}`
                );
                const optionContainer = optionsElement.querySelector(
                    `.${Quiz.SELECTORS.OPTION_CONTAINER(index + 1)}`
                );
                if (optionContainer && optionElement) {
                    optionElement.classList.remove("selected");
                    optionContainer.classList.remove("selected");
                }
            })
        }
    }

    private onDisabledOptionsChange(disabledOptions: Set<number>) {
        const optionsElement = this.element.querySelector(`.${Quiz.SELECTORS.OPTIONS}`);
        if (optionsElement) {
            this.state.optionsElements.forEach((_, index) => {
                const optionContainer = optionsElement.querySelector(
                    `.${Quiz.SELECTORS.OPTION_CONTAINER(index + 1)}`
                );
                const radio = optionContainer?.querySelector('input');
                const xMark = optionContainer?.querySelector(`.${Quiz.SELECTORS.X_MARK}`) as HTMLDivElement;

                if (optionContainer && radio && xMark) {
                    if (disabledOptions.has(index + 1)) {
                        optionContainer.classList.add("disabled");
                        radio.style.display = "none";
                        xMark.style.display = "inline-block";
                        radio.disabled = true;
                    }
                }
            });
        }
    }

    private onStatusChange(status: QuizState['status']) {
        const quiz = this.element.closest(`.${Quiz.SELECTORS.QUIZ}`);
        if (quiz) {
            quiz.setAttribute("data-status", this.state.status)
        }
        // Highlight correct answer if no more attempts
        if (status === "wrong") {
            this.state.correctOptions.forEach(correctIndex => {
                const optionContainer = this.element.querySelector(
                    `.${Quiz.SELECTORS.OPTION_CONTAINER(correctIndex)}`
                );
                if (optionContainer) {
                    optionContainer.classList.add("correct-answer");
                    // Hide X mark for correct answer when revealed
                    this.setState({ isAnswerRevealed: true })
                    const xMark = optionContainer.querySelector(`.${Quiz.SELECTORS.X_MARK}`) as HTMLDivElement;
                    if (xMark) {
                        xMark.style.display = "none";
                    }
                }
            });
        }
        // if quizz status is correct || wrong
        if (status !== "un-attempt") {
            const restButton = this.element.querySelector(`.${Quiz.SELECTORS.RESET_BUTTON}`) as HTMLButtonElement
            if (restButton) {
                restButton.style.display = "none"
            }
        }
    }

    private onShowHintChange(showHint: boolean) {
        const hintElement = this.element.querySelector(`.${Quiz.SELECTORS.HINT}`) as HTMLDivElement;
        if (hintElement && showHint) {
            hintElement.innerText = this.state.hint;
            hintElement.style.display = "block"
        } else {
            hintElement.innerHTML = "";
            hintElement.style.display = "none"
        }
    }

    private setupQuizClickHandler() {
        this.element.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;

            // Don't trigger if clicking on or within these elements
            const isInteractiveElement = target.closest(`.${Quiz.SELECTORS.SUBMIT}`)

            if (!isInteractiveElement) {
                this.hideHint();
            }
        });
    }

    private onOptionClick(clickedIndex: number) {
        if (this.state.disabledOptions.has(clickedIndex)) {
            return;
        }

        const newSelectedOptions = new Set(this.state.selectedOptions);

        if (this.state.isMultipleSelection) {
            if (newSelectedOptions.has(clickedIndex)) {
                newSelectedOptions.delete(clickedIndex);
            } else {
                newSelectedOptions.add(clickedIndex);
            }
        } else {
            newSelectedOptions.clear();
            newSelectedOptions.add(clickedIndex);
        }

        this.setState({ selectedOptions: new Set(newSelectedOptions) });
        this.emit("selection", Array.from(newSelectedOptions));

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
        const isCorrect = this.checkAnswer()
        this.emit("submit", { isCorrect, selectedArray });
    }

    public showHint(hintText: string) {
        this.setState({ showHint: true, hint: hintText })
    }

    public hideHint() {
        this.setState({ showHint: false, hint: "" })
    }

    public checkAnswer(): boolean {
        const selectedArray = Array.from(this.state.selectedOptions).sort();
        const correctArray = [...this.state.correctOptions].sort();
        const isCorrect = this.arraysEqual(selectedArray, correctArray);


        if (!isCorrect) {
            // Disable wrong options
            selectedArray.forEach(option => {
                const newDisabledOptions = new Set(this.state.disabledOptions);
                newDisabledOptions.add(option);
                this.setState({
                    disabledOptions: newDisabledOptions,
                });
            });

            const remainingValidOptions = this.state.optionsElements.length - this.state.disabledOptions.size;

            // If only one valid option remains, it must be correct, so show it
            if (remainingValidOptions <= 1) {
                this.setState({
                    showSubmit: false,
                    status: "wrong",
                });
            }
        } else {
            this.setState({ showSubmit: false, status: 'correct' })
        }

        return isCorrect;
    }

    private arraysEqual(arr1: number[], arr2: number[]): boolean {
        return arr1.length === arr2.length &&
            arr1.every((value, index) => value === arr2[index]);
    }

    getElement(): Element {
        return this.element;
    }

    appendTo(container: HTMLDivElement): void {
        const quiz = document.createElement("div");
        quiz.classList.add("quiz");
        quiz.setAttribute("data-status", this.state.status)
        quiz.setAttribute('data-type', this.state.isMultipleSelection ? "multiple" : "single")
        this.element.classList.add("quiz_container");
        quiz.appendChild(this.element);
        this.element.id = this.id;
        container.appendChild(quiz);
    }

    getSubElements(): ContentElement[] {
        return [
            ...this.state.questionElements,
            ...this.state.optionsElements,
            ...this.state.explanationElements,
        ];
    }
}


type InputState = {
    questionElements: ContentElement[];
    inputValue: string;
    explanationElements: ContentElement[];
    isExplanationVisible: boolean;
    showHint: boolean;
    hint: string;
}

export class InputQuiz extends ReactiveElement<InputState> implements ContentElement {
    id: string = "";
    public readonly type: string = "input_quiz";
    private static readonly SELECTORS = {
        ELEMENT: "input_quiz",
        QUESTION: "input_quiz_question",
        INPUT: "input_quiz_input",
        HINT: "input_quiz_hint",
        EXPLANATION_BUTTON: "input_quiz_explanation_button",
        EXPLANATION_CONTENT: "input_quiz_explanation_content",
        SUBMIT_BUTTON: "input_quiz_submit"
    }

    public element: Element;
    private inputElement: HTMLInputElement;

    constructor(
        public inputType: string,
        questionElements: ContentElement[],
        explanationElements: ContentElement[] = []
    ) {
        super();
        this.element = document.createElement("div");
        this.state = this.createState({
            questionElements,
            inputValue: "",
            explanationElements,
            isExplanationVisible: false,
            showHint: false,
            hint: ""
        });

        this.inputElement = document.createElement("input");
        this.inputElement.type = inputType;
        this.initQuiz();
        this.setupQuizClickHandler();
    }


    private setupQuizClickHandler() {
        this.element.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;

            // Don't trigger if clicking on or within these elements
            const isInteractiveElement = target.closest(InputQuiz.SELECTORS.SUBMIT_BUTTON)

            if (!isInteractiveElement) {
                // this.setState({ showHint: false, hint: "" })
            }
        });
    }


    private initQuiz() {
        this.renderQuestion(this.state.questionElements);
        this.renderInputField();
        this.renderHint();
        this.renderExplanation();
        this.renderSubmitButton();

        // Set up reactive subscriptions
        this.subscribe('inputValue', (value) => this.onInputValueChange(value));
        this.subscribe('isExplanationVisible', (value) => this.onExplanationVisibilityChange(value));
        this.subscribe("showHint", (value) => this.onShowHintChange(value))
        this.subscribe("hint", (value) => this.onHintChange(value))
    }

    private renderQuestion(elements: ContentElement[]) {
        let questionElement = document.createElement("div");
        questionElement.classList.add(InputQuiz.SELECTORS.QUESTION);
        questionElement = Content.CombineELements(questionElement, ...elements);
        this.element.appendChild(questionElement);
    }

    private renderInputField() {
        this.inputElement.classList.add(InputQuiz.SELECTORS.QUESTION);
        this.inputElement.addEventListener("input", (e) => {
            this.state.inputValue = (e.target as HTMLInputElement).value;
        });
        this.element.appendChild(this.inputElement);
    }

    private renderHint() {
        const hintElement = document.createElement("div");
        hintElement.classList.add(InputQuiz.SELECTORS.HINT);
        hintElement.style.display = this.state.showHint ? "block" : "none"
        this.element.appendChild(hintElement);
    }

    private renderExplanation() {
        const explanationButton = document.createElement("button");
        const explanationContent = document.createElement("div");

        explanationButton.textContent = "Show Explanation";
        explanationButton.classList.add(InputQuiz.SELECTORS.EXPLANATION_BUTTON);
        explanationButton.addEventListener("click", () => {
            this.state.isExplanationVisible = !this.state.isExplanationVisible;
        });

        explanationContent.classList.add(InputQuiz.SELECTORS.EXPLANATION_CONTENT);
        explanationContent.style.display = "none";
        this.state.explanationElements.forEach((element: any) =>
            element.appendTo(explanationContent)
        );

        this.element.appendChild(explanationButton);
        this.element.appendChild(explanationContent);
    }

    private renderSubmitButton() {
        const submitButton = document.createElement("button");
        submitButton.textContent = "Submit";
        submitButton.classList.add(InputQuiz.SELECTORS.SUBMIT_BUTTON);
        submitButton.addEventListener("click", () => this.emit("submit", this.state.inputValue));
        this.element.appendChild(submitButton);
    }

    private onExplanationVisibilityChange(isVisible: boolean) {
        const explanationButton = this.element.querySelector(
            `.${InputQuiz.SELECTORS.EXPLANATION_BUTTON}`
        ) as HTMLButtonElement;
        const explanationContent = this.element.querySelector(
            `.${InputQuiz.SELECTORS.EXPLANATION_CONTENT}`
        ) as HTMLDivElement;

        explanationButton.textContent = isVisible ? "Hide Explanation" : "Show Explanation";
        explanationContent.style.display = isVisible ? "block" : "none";
    }

    private onShowHintChange(showHint: boolean) {
        const hintElement = this.element.querySelector(`.${InputQuiz.SELECTORS.HINT}`) as HTMLDivElement;
        if (hintElement && showHint) {
            hintElement.style.display = showHint ? "block" : "none"
        }
    }

    private onHintChange(value: string) {
        const hintElement = this.element.querySelector(`.${InputQuiz.SELECTORS.HINT}`) as HTMLDivElement;
        if (hintElement) {
            hintElement.innerText = value
        }
    }


    public showHint(text: string) {
        this.setState({ showHint: true, hint: text })
    }



    private onInputValueChange(value: string) {
        this.emit("onchange", value);
    }


    getElement(): Element {
        return this.element;
    }

    appendTo(container: HTMLDivElement): void {
        this.element.id = this.id;
        this.element.classList.add(InputQuiz.SELECTORS.ELEMENT);
        container.appendChild(this.element);
    }

    getSubElements(): ContentElement[] {
        return [...this.state.questionElements, ...this.state.explanationElements];
    }
}