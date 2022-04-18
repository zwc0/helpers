interface IOptions {
    size?: string;
    prepend?: boolean;
    buttons?: [string, string];
}

interface IConfig {
    sizeMap?: Map<string, string>;
    templates?: {
        container?;
        content?;
        header?;
        note?;
        confirm?;
        confirmButtons?;
    };
}

function stringToHtml(str: string){
    const div = document.createElement('div');
    div.innerHTML = str;
    return div.firstChild as HTMLElement;
}

function isDelegate(el: Element, selector: string){
    return el.matches(selector) || el.closest(selector);
}

function getConfig(config: IConfig){
    return {
        sizeMap: config.sizeMap || new Map([
            ['sm', 'max-w-[300px]'],
            ['md', 'max-w-[500px]'],
            ['lg', 'max-w-[800px]'],
            ['xl', 'max-w-[1140px]'],
            ['2xl', 'max-w-[1500px]']
        ]),
        templates: {
            container: config.templates?.container || ((content) =>
                `<div class="fixed inset-0 overflow-auto bg-black-default bg-opacity-50" role="dialog" tabindex="-1">
                    ${content}
                </div>`),
            content: config.templates?.content || ((config, size: string, inner: string) =>
                `<div class="${config.sizeMap.get(size || 'sm') || size}" role="document">
                    ${inner}
                </div>`),
            header: config.templates?.header || ((text: string) => `<div class="p-2 px-3 bg-black bg-opacity-25 flex items-center">
                <h5 class="flex-grow">${text}</h5>
                <button type="button" class="text-3xl leading-none" data-bs-dismiss="modal" aria-label="Close">×</button>
            </div>`),
            note: config.templates?.note || ((config, opts, header, body) =>
                config.templates.container(config.templates.content(config, opts.size || 'sm', `
                    ${config.templates.header(header)}
                        <div class="p-2"><center>${body}</center></div>
                        <div class="flex justify-end p-2 px-3">
                            <button type="button" data-true data-bs-dismiss="modal" class="p-1 w-20 bg-green-400 mx-4">Close</button>
                        </div>
                    </div>
                `))),
            confirm: config.templates?.confirm || ((config, opts, header, body, buttons) =>
                config.templates.container(
                    config.templates.content(config, opts.size || 'md', `
                        ${config.templates.header(header)}
                        <div class="p-2"><center>${body}</center></div>
                        <div class="flex justify-end p-2 px-3" data-id="buttons">
                            ${config.divs.confirmButtons(buttons)}
                        </div>`
                    )
                )),
            confirmButtons: config.templates?.confirmButtons || ((buttons: [string, string]) =>
                `<button type="button" data-true data-bs-dismiss="modal" class="p-1 w-20 bg-green-400 mx-4">${buttons[0]}</button>
                <button type="button" data-bs-dismiss="modal" class="p-1 w-20 bg-red-400 mx-4">${buttons[1]}</button>`)
        }
    };
}

const Modal = (configOverride: IConfig = {}) => {
    const config = getConfig(configOverride);

    function note(header: string, body: string, opts: IOptions = {}) {
        let modalContent = config.templates.note(config, opts, header, body);
        document.body.append(stringToHtml(modalContent));
        const modal = document.body.lastElementChild as HTMLElement;
        const promise: any = new Promise(res => {
            modal.addEventListener('click', e => {
                if (!isDelegate(e?.target as Element, '[data-bs-dismiss="modal"]'))
                    return;
                document.body.removeChild(modal);
                res(true);
            });
        });
        promise.modal = modal;
        function keyClick(e: any) {
            if (e.keyCode == 13 || e.keyCode == 32) e.preventDefault(), e.target.click();
        }
        modal.addEventListener('keydown', keyClick);
        (modal.querySelector('[data-true]') as HTMLElement).focus();
        return promise;
    }

    function confirm(header: string, body: string, opts: IOptions = {}) {
        let response: boolean;
        function check(e: any) { response = e.target.hasAttribute('data-true') };
        const buttons = opts.buttons || ['Ok', 'Cancel'];
        let modalContent = config.templates.confirm(config, opts, header, body, buttons);
        document.body.append(stringToHtml(modalContent));
        const modal = document.body.lastElementChild as HTMLElement;
        modal.addEventListener('mousedown', check);
        const promise: any = new Promise(res => {
            modal.addEventListener('click', e => {
                if (!isDelegate(e.target as Element, '[data-bs-dismiss="modal"]'))
                    return;
                document.body.removeChild(modal);
                res(response);
            });
        });
        promise.modal = modal;
        function keyClick(e: any) {
            check(e);
            if (e.keyCode == 37 || e.keyCode == 39) (modal.querySelector('[data-id="buttons"] button:not(:focus)') as HTMLElement).focus();
            if (e.keyCode == 13 || e.keyCode == 32) e.preventDefault(), e.target.click();
        }
        modal.addEventListener('keydown', keyClick);
        (modal.querySelector('[data-true]') as HTMLElement).focus();
        return promise;
    }

    function html(html: string, opts: IOptions = {}) {
        const body = document.body;
        const modalContent = config.templates.container(config.templates.content(config, opts.size || 'lg', html));
        const modal = stringToHtml(modalContent);
        if (opts.prepend)
            body.prepend(modal);
        else
            body.append(modal);
        return modal;
    }

    return {note, confirm, html, config};
}

export default Modal;
