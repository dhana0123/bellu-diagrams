import { Content, ContentElement } from "./content"

interface QuizState {
    showSubmit: boolean;
    isExplanationVisible: boolean;
    isExplanationViewed: boolean;
    selectedOptions: Set<number>;
    status: "un-attempt" | "correct" | "wrong" | "completed";
    disabledOptions: Set<number>;
    answerRevealed: boolean;
    showHint: boolean;
    hint: string;
}

type OptionType = "grid" | "list"


export class Quiz implements ContentElement {
    id: string = "";
    public readonly type: string = "quiz";
    private questionElements: ContentElement[] = [];
    private options: ContentElement[] = [];
    public element: Element;
    private explanationElements: ContentElement[] = [];
    private callbacks: { [event: string]: Function[] } = {};
    public isMultipleSelection: boolean;
    public readonly correctOptions: number[] = []
    private quiz_footer: HTMLDivElement | null = null;
    public optionType: OptionType = "list"


    private static readonly SELECTORS = {
        QUIZ: '.quiz',
        SUBMIT_BUTTON: '.quiz_submit',
        OPTIONS: '.quiz_options',
        OPTION: (index: number) => `.option_${index}`,
        OPTION_CONTAINER: (index: number) => `.option_container_${index}`,
        EXPLANATION_BUTTON: '.quiz_explanation_button',
        EXPLANTION_CONTENT: ".quiz_explanation_content",
        X_MARK: ".x-mark",
        RESET_BUTTON: ".quiz_reset",
        QUIZ_HINT: ".quiz_hint"
    };

    private static readonly CLASSES = {
        SELECTED: 'selected',
        DISABLED: 'disabled',
        CORRECT: 'correct',
        WRONG: 'wrong',
        ACTIVE: 'active',
        HIDDEN: 'hidden',
        COMPLETED: 'completed'
    } as const;

    // State management
    public state: QuizState = {
        showSubmit: true,
        isExplanationVisible: false,
        isExplanationViewed: false,
        showHint: false,
        selectedOptions: new Set(),
        status: 'un-attempt',
        hint: "",
        disabledOptions: new Set(),
        answerRevealed: false
    };

    constructor(
        status: QuizState['status'],
        optionType: OptionType,
        questionElements: ContentElement[],
        options: ContentElement[],
        isMultipleSelection: boolean = false,
        explanationElements: ContentElement[] = [],
        correctOptions: number[] = [],
    ) {
        this.element = document.createElement('div');
        this.questionElements = questionElements;
        this.options = options;
        this.isMultipleSelection = isMultipleSelection;
        this.explanationElements = explanationElements;
        this.correctOptions = correctOptions;
        this.optionType = optionType;
        this.state = { ...this.state, status, showSubmit: status !== "completed" }
        this.initQuizz();
        this.setupQuizClickHandler();
    }

    public setState(newState: Partial<QuizState>) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...newState };
        this.set(oldState);
    }

    private initQuizz() {
        this.renderQuestions();
        this.renderOptions();
        this.renderHint();
        this.renderExplanation();
        this.renderSubmitButton();
        this.renderExplanationButton();
        this.renderResetButton();
    }

    private set(oldState: QuizState) {
        // Update submit button text
        if (oldState.showSubmit !== this.state.showSubmit) {
            const submitButton = document.querySelector(Quiz.SELECTORS.SUBMIT_BUTTON) as HTMLButtonElement
            if (submitButton) {
                submitButton.style.display = this.state.showSubmit ? "display" : "none"
            }
        }

        // Update explanation visibility
        if (oldState.isExplanationVisible !== this.state.isExplanationVisible) {
            const explanationButton = this.element.querySelector(
                Quiz.SELECTORS.EXPLANATION_BUTTON
            ) as HTMLButtonElement;
            const explanationContent = this.element.querySelector(
                Quiz.SELECTORS.EXPLANTION_CONTENT
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
            const optionsElement = document.querySelector(Quiz.SELECTORS.OPTIONS);

            if (this.state.answerRevealed) return
            if (this.state.status === Quiz.CLASSES.CORRECT || this.state.status === Quiz.CLASSES.COMPLETED) return

            if (optionsElement) {
                this.options.forEach((_, index) => {
                    const optionElement = optionsElement.querySelector(
                        Quiz.SELECTORS.OPTION(index + 1)
                    );
                    const optionContainer = optionsElement.querySelector(
                        Quiz.SELECTORS.OPTION_CONTAINER(index + 1)
                    );
                    if (optionContainer && optionElement) {
                        if (this.state.selectedOptions.has(index + 1)) {
                            optionElement.classList.add(Quiz.CLASSES.SELECTED);
                            optionContainer.classList.add(Quiz.CLASSES.SELECTED);
                        } else {
                            optionElement.classList.remove(Quiz.CLASSES.SELECTED);
                            optionContainer.classList.remove(Quiz.CLASSES.SELECTED);
                        }
                    }
                });
            }
        }

        // upate on answer revalead
        if (oldState.answerRevealed !== this.state.answerRevealed) {
            const optionsElement = document.querySelector(Quiz.SELECTORS.OPTIONS);
            if (optionsElement) {
                (this.options || []).map((_, index) => {
                    const optionElement = optionsElement.querySelector(
                        Quiz.SELECTORS.OPTION(index + 1)
                    );
                    const optionContainer = optionsElement.querySelector(
                        Quiz.SELECTORS.OPTION_CONTAINER(index + 1)
                    );
                    if (optionContainer && optionElement) {
                        optionElement.classList.remove(Quiz.CLASSES.SELECTED);
                        optionContainer.classList.remove(Quiz.CLASSES.SELECTED);
                    }
                })
            }
        }


        // update the interaction
        if (oldState.status !== this.state.status) {
            const quiz = this.element.closest(Quiz.SELECTORS.QUIZ);
            if (quiz) {
                quiz.setAttribute("data-status", this.state.status)
            }
        }
        // Update disabled options
        if (oldState.disabledOptions !== this.state.disabledOptions) {
            const optionsElement = document.querySelector(Quiz.SELECTORS.OPTIONS);
            if (optionsElement) {
                this.options.forEach((_, index) => {
                    const optionContainer = optionsElement.querySelector(
                        Quiz.SELECTORS.OPTION_CONTAINER(index + 1)
                    );
                    const radio = optionContainer?.querySelector('input');
                    const xMark = optionContainer?.querySelector(Quiz.SELECTORS.X_MARK) as HTMLDivElement;

                    if (optionContainer && radio && xMark) {
                        if (this.state.disabledOptions.has(index + 1)) {
                            optionContainer.classList.add(Quiz.CLASSES.DISABLED);
                            radio.style.display = "none";
                            xMark.style.display = "inline-block";
                            radio.disabled = true;
                        } else {
                            optionContainer.classList.remove(Quiz.CLASSES.DISABLED);
                            radio.disabled = false;
                            xMark.style.display = "none"
                            if (this.optionType === "list") {
                                radio.style.display = "inline-block"
                            }
                        }
                    }
                });
            }
        }

        // Highlight correct answer if no more attempts
        if (oldState.status !== this.state.status && this.state.status === Quiz.CLASSES.WRONG) {
            this.correctOptions.forEach(correctIndex => {
                const optionContainer = this.element.querySelector(
                    Quiz.SELECTORS.OPTION_CONTAINER(correctIndex)
                );
                if (optionContainer) {
                    optionContainer.classList.add("correct-answer");
                    // Hide X mark for correct answer when revealed
                    this.setState({ answerRevealed: true })
                    const xMark = optionContainer.querySelector(Quiz.SELECTORS.X_MARK) as HTMLDivElement;
                    if (xMark) {
                        xMark.style.display = "none";
                    }
                }
            });
        }

        // if quizz status is correct || wrong
        if (oldState.status !== this.state.status && this.state.status !== "un-attempt") {
            const restButton = this.element.querySelector(Quiz.SELECTORS.RESET_BUTTON) as HTMLButtonElement
            if (restButton) {
                restButton.style.display = "none"
            }
        }

        //  show thhe hint
        if (oldState.showHint !== this.state.showHint) {
            const hintElement = this.element.querySelector(Quiz.SELECTORS.QUIZ_HINT) as HTMLDivElement;
            if (hintElement && this.state.showHint) {
                hintElement.innerText = this.state.hint;
                hintElement.style.display = "block"
            } else {
                hintElement.innerHTML = "";
                hintElement.style.display = "none"
            }
        }
    }


    private renderQuestions() {
        let questionElement = document.createElement("div");
        questionElement.classList.add("quiz_question");
        questionElement = Content.CombineELements(questionElement, ...this.questionElements);
        this.element.appendChild(questionElement);
    }

    private renderOptions() {
        const existingOptionsElement = document.querySelector(Quiz.SELECTORS.OPTIONS);
        if (existingOptionsElement) {
            this.element.removeChild(existingOptionsElement);
        }

        let optionsElement = document.createElement("div");
        optionsElement.classList.add("quiz_options");
        optionsElement.setAttribute(`data-type`, this.optionType)

        let isCompleted = this.state.status === "completed"

        this.options.forEach((ele, index) => {
            const optionContainer = document.createElement("div");
            optionContainer.classList.add(`option_container`, `option_container_${index + 1}`);
            const radio = document.createElement("input");
            radio.type = this.isMultipleSelection ? "checkbox" : "radio";
            radio.name = `quiz_${this.id}_option`;
            radio.id = `quiz_${this.id}_option_${index + 1}`;
            radio.classList.add("option_input");
            radio.checked = isCompleted ? false : this.state.selectedOptions.has(index + 1);
            radio.disabled = isCompleted


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

            if (isCompleted) {
                if (this.correctOptions.includes(index + 1)) {
                    optionContainer.classList.add(Quiz.CLASSES.SELECTED)
                } else {
                    optionContainer.classList.add(Quiz.CLASSES.DISABLED)
                }
            } else {
                const handleClick = () => this.onOptionClick(index + 1);
                optionContainer.addEventListener("click", (e) => {
                    if (e.target !== radio && !this.state.disabledOptions.has(index + 1)) {
                        radio.checked = true;
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
        explanationButton.classList.add("quiz_explanation_button");
        explanationButton.addEventListener("click", () => this.toggleExplanation());
        const quiz_footer = this.getQuizzFooter();
        quiz_footer.appendChild(explanationButton);
    }

    private renderExplanation() {
        const explanationContent = document.createElement("div");
        explanationContent.classList.add("quiz_explanation_content");
        explanationContent.style.display = this.state.isExplanationViewed ? "block" : "none";
        this.explanationElements.forEach((element) =>
            element.appendTo(explanationContent)
        );
        this.element.appendChild(explanationContent);
    }

    private renderHint() {
        const hintElement = document.createElement("div");
        hintElement.classList.add("quiz_hint");
        hintElement.style.display = this.state.showHint ? "block" : "none";
        this.element.appendChild(hintElement);
    }

    private renderSubmitButton() {
        const submitButton = document.createElement("button");
        submitButton.textContent = "Check";
        const quiz_footer = this.getQuizzFooter();
        submitButton.style.display = this.state.showSubmit ? "block" : "none";
        submitButton.classList.add("quiz_submit");
        submitButton.addEventListener("click", () => this.onSubmit());
        quiz_footer.appendChild(submitButton);
    }

    private renderResetButton() {
        const resetButton = document.createElement("button");
        resetButton.textContent = "Start fresh";
        resetButton.classList.add("quiz_reset");
        resetButton.addEventListener("click", () => this.resetQuiz());

        const quiz_footer = this.getQuizzFooter();
        quiz_footer.appendChild(resetButton);
    }


    private toggleExplanation() {
        this.setState({
            isExplanationViewed: true,
            showSubmit: false,
            isExplanationVisible: !this.state.isExplanationVisible
        });

        this.emit("explanationToggle", this.state.isExplanationVisible);
    }

    private resetQuiz() {
        this.setState({
            showSubmit: true,
            isExplanationVisible: false,
            isExplanationViewed: false,
            showHint: false,
            selectedOptions: new Set(),
            status: 'un-attempt',
            hint: "",
            disabledOptions: new Set(),
            answerRevealed: false,
        });
    }


    private setupQuizClickHandler() {
        this.element.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;

            // Don't trigger if clicking on or within these elements
            const isInteractiveElement = target.closest(Quiz.SELECTORS.SUBMIT_BUTTON)

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
        const correctArray = [...this.correctOptions].sort();
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

            const remainingValidOptions = this.options.length - this.state.disabledOptions.size;

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
        quiz.setAttribute('data-type', this.isMultipleSelection ? "multiple" : "single")
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


type InputState = {
    questionElements: ContentElement[];
    inputValue: string;
    explanationElements: ContentElement[];
    isExplanationVisible: boolean;
    showHint: boolean;
    hint: string;
}

export class InputQuiz implements ContentElement {
    id: string = "";
    public readonly type: string = "input_quiz";
    private state: {
        questionElements: ContentElement[];
        inputValue: string;
        explanationElements: ContentElement[];
        isExplanationVisible: boolean;
        showHint: boolean;
        hint: string;
    };

    private static readonly SELECTORS = {
        ELEMENT: "input_quiz",
        QUESTION: "input_quiz_question",
        INPUT: "input_quiz_input",
        HINT: "input_quiz_hint",
        EXPLANATION_BUTTON: "input_quiz_explanation_button",
        EXPLANATION_CONTENT: "input_quiz_explanation_content",
        SUBMIT_BUTTON: "input_quiz_submit"
    }

    private subscribers: Map<string, Set<(value: any) => void>> = new Map();
    public element: Element;
    private inputElement: HTMLInputElement;

    constructor(
        public inputType: string,
        questionElements: ContentElement[],
        explanationElements: ContentElement[] = []
    ) {
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

    private createState<T extends object>(initialState: T): T {
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

    subscribe(property: string, callback: (value: any) => void) {
        if (!this.subscribers.has(property)) {
            this.subscribers.set(property, new Set());
        }
        this.subscribers.get(property)?.add(callback);
    }

    unsubscribe(property: string, callback: (value: any) => void) {
        this.subscribers.get(property)?.delete(callback);
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
        this.state.explanationElements.forEach(element =>
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
        console.log('shoHINTTT')
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


    private setState<K extends keyof InputState>(state: Pick<InputState, K>) {
        Object.keys(state).forEach(key => {
            this.state[key as K] = state[key as K];
        });
    }

    public showHint(text: string) {
        this.setState({ showHint: true, hint: text })
    }



    private onInputValueChange(value: string) {
        this.emit("onchange", value);
    }

    emit(eventName: string, data?: any): void {
        if (this.subscribers.has(eventName)) {
            this.subscribers.get(eventName)?.forEach(callback => callback(data));
        }
    }

    on(eventName: string, callback: Function): void {
        this.subscribe(eventName, callback as (value: any) => void);
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