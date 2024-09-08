$(async function () {
    const db = new Dexie('retro_emocoes');

    db.version(1).stores({
        emocoes: '++id, data, emocao'
    });

    db.open().catch(function (e) {
        console.error("DB open failed: " + e.stack);
    });

    const formatData = function (date) {
        return date.toISOString().replace('T', ' ').replace(/\:\d{2}\.\w+$/gm, '');
    }
    const gerarPDF = async function (emocoes) {
        const docDefinition = {
            pageSize: 'A4',
            content: [],
            styles: {
                header: {
                    bold: true
                },
                normalText: {
                }
            },
            defaultStyle: {
                fontSize: 16
            }
        };

        await emocoes.forEach((emo, index) => {
            docDefinition.content.push({
                columns: [
                    [
                        { text: 'Data:', style: 'header', margin: [0, 0, 0, 10] },
                        { text: 'Emoção:', style: 'header', margin: [0, 0, 0, 10] },
                        { text: 'Cor associada:', style: 'header', margin: [0, 0, 0, 20] }
                    ],
                    [
                        { text: formatData(emo.data), style: 'normalText', margin: [0, 0, 0, 10] },
                        { text: emo.emocao, style: 'normalText', margin: [0, 0, 0, 10] },
                        { text: 'XXXXXXXXX',  color: emo.cor, background: emo.cor, margin: [0, 0, 0, 20] },
                    ]
                ]
            });
            docDefinition.content.push({ text: 'Como estava quando senti?', style: 'header' });
            docDefinition.content.push({ text: emo.estava, style: 'normalText', margin: [0, 0, 0, 20] });
            docDefinition.content.push({ text: 'O que senti no meu corpo?', style: 'header' });
            docDefinition.content.push({ text: emo.senti, style: 'normalText', margin: [0, 0, 0, 20] });
            docDefinition.content.push({ text: 'O que pensei sobre mim?', style: 'header' });
            if (index < (emocoes.length - 1)) {
                docDefinition.content.push({ text: emo.pensei, style: 'normalText', pageBreak: 'after' });
            }
            else {
                docDefinition.content.push({ text: emo.pensei, style: 'normalText' });
            }
        });

        pdfMake.createPdf(docDefinition).download();
    }
    const gerarExcel = async function (emocoes, format) {
        const formato = format || 'xlsx';
        let rows = [];

        emocoes.forEach(emo => {
            rows.push({
                a: formatData(emo.data),
                b: emo.emocao,
                c: emo.cor,
                d: emo.estava,
                e: emo.senti,
                f: emo.pensei
            });
        });

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.sheet_add_aoa(
            worksheet,
            [["Data", "Emoção", "Cor", "Como estava quando senti?", "O que senti no meu corpo?", "O que pensei sobre mim?"]],
            { origin: "A1" }
        );

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Emoções');
        XLSX.writeFile(workbook, ('exportar.' + formato), { compression: true });
    }
    const gerarJSON = async function (emocoes) {
        const jsonString = JSON.stringify(emocoes.map(emo => {
            const { id, ...rest } = emo;
            return rest;
        }));
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download
            = 'exportar.json';
        a.click();

        URL.revokeObjectURL(url);
    }
    const emoImport = async function (emocoes) {
        if (emocoes.length > 0) {
            const result = {
                importados: 0,
                ignorados: 0
            };
            for (const [key, emo] of Object.entries(emocoes.map(emo => {
                const emocao = emo;
                emocao.data  = new Date(emo.data);

                return emocao;
            }))) {
                const emocao = await db.emocoes.where({
                    'data': emo.data,
                    'emocao': emo.emocao,
                    'cor': emo.cor,
                    'estava': emo.estava,
                    'senti': emo.senti,
                    'pensei': emo.pensei
                }).toArray();

                if (emocao.length === 0) {
                    db.emocoes.add(emo);
                    result.importados++;
                }
                else {
                    result.ignorados++;
                }
            }

            Toast.fire({
                'icon': 'info',
                'title': `Foram ${result.importados} importados com sucesso e ${result.ignorados} ignorados por já existirem.`,
            }).then(() => {
                if (result.importados > 0) window.location.reload();
            });
        }
    }

    let timer;
    const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        }
    });
    const ide   = parseInt(window.location.hash.replace('#', ''));

    if ($("#lista").length > 0) {
        const template = '<div id="emo{IDE}" class="collapse collapse-plus bg-base-100 my-8">\n' +
            '  <input type="checkbox" name="accordion-emocao" />\n' +
            '  <div class="collapse-title text-md font-semibold">{DATA} - {EMO}</div>\n' +
            '  <div class="collapse-content">\n' +
            '     <h3 class="font-semibold">Como estava quando senti?</h3>\n' +
            '     <p class="w-full">{ESTAVA}</p>\n' +
            '     <h3 class="font-semibold mt-6">O que senti no meu corpo?</h3>\n' +
            '     <p class="w-full">{SENTI}</p>\n' +
            '     <h3 class="font-semibold mt-6">O que pensei sobre mim?</h3>\n' +
            '     <p class="w-full">{PENSEI}</p>\n' +
            '     <h3 class="font-semibold mt-6">Cor associada:</h3>\n' +
            '     <span class="cor-lista mt-2 w-full md:w-80 h-10 rounded-md block" style="background-color: {COR};"></span>\n' +
            '     <div class="flex justify-end mt-8" data-ide="{IDE}">\n' +
            '       <button class="btn btn-secondary mr-4 apagar">Apagar</button>\n' +
            '       <button class="btn btn-primary editar">Editar</button>\n' +
            '     <div>\n' +
            '  </div>\n' +
            '</div>';

        const emocoes = await db.emocoes.reverse().sortBy('data');

        if (emocoes.length > 0) {
            $("#lista").html("");
        }
        else {
            $("#listaPlaceholder").removeClass("hidden");
            $("#removeAll, #export").parent().hide();
        }

        await emocoes.forEach((emo) => {
            $("#lista").append(
                template
                    .replace(/{DATA}/g, formatData(emo.data))
                    .replace(/{EMO}/g, emo.emocao)
                    .replace(/{ESTAVA}/g, emo.estava)
                    .replace(/{SENTI}/g, emo.senti)
                    .replace(/{PENSEI}/g, emo.pensei)
                    .replace(/{IDE}/g, emo.id)
                    .replace(/{COR}/g, emo.cor)
            );
        });

        $("#lista").on('click', '.apagar', function (e) {
            e.preventDefault();
            const self = $(e.target).parent();
            const ide  = self.data('ide');

            Swal.fire({
                title: "Tem a certeza?",
                text: "Irá apagar o registo definitivamente",
                icon: "question",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#3085d6",
                confirmButtonText: "Apagar",
                cancelButtonText: "Cancelar"
            }).then(async (result) => {
                if (result.isConfirmed) {
                    const deleteCount = await db.emocoes.where("id").equals(ide).delete();
                    if (deleteCount > 0)  {
                        self.parent().parent().hide();
                    }
                    else {
                        Toast.fire({
                            icon: "error",
                            title: "Ocorreu um erro ao apagar o registo"
                        });
                    }
                }
            });
        });
        $("#lista").on('click', '.editar', function (e) {
            e.preventDefault();
            const ide            = $(e.target).parent().data('ide');
            window.location.href = "/emocao.html#" + String(ide);
        });

        if (ide > 0) {
            $("#emo" + String(ide)).find('input[type="checkbox"]').prop('checked', true);

            $('html, body').animate({
                scrollTop: $("#emo" + String(ide)).find('input[type="checkbox"]').offset().top
            }, 400);
        }

        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                $("#lembrete").removeClass('hidden');
            }
        }

        $("#removeAll").on("click", function (e) {
            e.preventDefault();

            Swal.fire({
                title: "Tem a certeza?",
                text: "Irá apagar TODOS os registos definitivamente",
                icon: "question",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#3085d6",
                confirmButtonText: "Apagar",
                cancelButtonText: "Cancelar"
            }).then(async (result) => {
                if (result.isConfirmed) {
                    await db.emocoes.clear();
                    window.location.reload();
                }
            });
        });
        $("#export").on("click", function (e) {
            e.preventDefault();

            Swal.fire({
                title: "Exportar em que formato?",
                input: "select",
                inputOptions: {
                    pdf: "PDF",
                    xlsx: "XLSX (Excel 2007+)",
                    xls: "XLS (Excel 97-2004)",
                    ods: "ODS (OpenOffice)",
                    csv: "CSV",
                    json: "JSON (Permite importação)"
                },
                inputPlaceholder: "Escolha um formato",
                showCancelButton: true,
                confirmButtonText: "Exportar",
                cancelButtonText: "Cancelar",
                showLoaderOnConfirm: true,
                preConfirm: async (format) => {
                    try {
                        switch (format) {
                            case "pdf":
                                await gerarPDF(emocoes);
                                break;
                            case "json":
                                await gerarJSON(emocoes);
                                break;
                            default:
                                await gerarExcel(emocoes, format);
                                break;
                        }

                        return true;
                    } catch (error) {
                        Swal.showValidationMessage(`Falhou com o erro: ${error}`);
                    }
                },
                allowOutsideClick: () => !Swal.isLoading()
            });
        });
        $("#import").on("click", async function (e) {
            e.preventDefault();

            const { value: file } = await Swal.fire({
                title: "Escolher ficheiro",
                input: "file",
                inputAttributes: {
                    "accept": "application/json",
                    "aria-label": "Importe o seu ficheiro JSON"
                }
            });

            const reader  = new FileReader();
            reader.onload = function(event)
            {
                const regex = /\[({"emocao":".+","cor":"#.+","estava":".+","senti":".+","pensei":".+","data":"\d+-\d+-\d+T\d+:\d+:\d+.\d+Z"},?)+\]/gm;
                const fileContent = event.target.result;
                if (fileContent && fileContent.match(regex)) {
                    try {
                        const importData = JSON.parse(fileContent);

                        emoImport(importData);
                    }
                    catch (e) {
                        Toast.fire({
                            icon: "warning",
                            title: "Ficheiro com formato inválido"
                        });
                    }
                }
                else {
                    Toast.fire({
                        icon: "warning",
                        title: "Ficheiro com formato inválido"
                    });
                }
            };

            reader.readAsText(file);
        });
        $("#lembrete").on("click", async function (e) {
            e.preventDefault();

            if (!('Notification' in window && Notification.permission === 'granted')) {
                Toast.fire({
                    icon: "warning",
                    title: "Tem de ativar as notificações para conseguir utilizar lembretes."
                });
                return;
            }

            let handle    = '';
            const options = {};
            for (let i = 0; i<24; i++) {
                handle = String(i) + ':00';
                options[handle] = handle;
                handle = String(i) + ':30';
                options[handle] = handle;
            }

            let footerNote  = '';
            const userAgent = navigator.userAgent;
            if (userAgent.indexOf('Macintosh') !== -1 && userAgent.indexOf('Mac OS') !== -1) {
                footerNote = 'Pressione a tecla Command para seleccionar vários.<br>';
            } else if (userAgent.indexOf('Windows') !== -1 || userAgent.indexOf('Linux') !== -1) {
                footerNote = 'Pressione a tecla CTRL para seleccionar vários.<br>';
            }
            footerNote += 'Se definir sem horários desactiva os lembretes.';

            const { value: horarios } = await Swal.fire({
                customClass: 'swal-lembrete',
                title: "Escolha os horários",
                input: "select",
                inputAttributes: {
                    multiple: true
                },
                preConfirm: () => {
                    let options = [];

                    const selected = Object.values(document.getElementById("swal2-select").selectedOptions);
                    selected.forEach((option) => {
                        options.push(option.value);
                    });

                    return options;
                },
                inputOptions: options,
                showCancelButton: true,
                confirmButtonText: "Definir",
                cancelButtonText: "Cancelar",
                footer: footerNote
            });

            localStorage.setItem('horarios', JSON.stringify(horarios));
        });
    }

    if ($("#emoForm").length > 0) {
        const emoSel = $("#emocaoPrevia");
        let emocoes  = await db.emocoes.reverse().sortBy('emocao');

        emocoes = emocoes.map(item => {
            return { cor: item.cor, emocao: item.emocao }
        }).reduce((acc, item) => {
            const parsed = JSON.stringify(item);
            if (!acc.has(parsed)) {
                acc.add(parsed);
            }

            return acc;
        }, new Set());

        emocoes.forEach(emo => {
            const parsed = JSON.parse(emo);
            emoSel.append(
                `<option data-cor="${parsed.cor}" data-emocao="${parsed.emocao}">${parsed.emocao}</option>`
            );
        });

        emoSel.on('change', function (e) {
            e.preventDefault();
            const self = $(this).find('option:selected');
            $("#emocao").val(self.data('emocao'));
            $("#cor").val(self.data('cor'));
        });

        $("#emocao, #cor").on('change', function (e) {
            e.preventDefault();
            emoSel.val('-');
        });

        if (ide > 0) {
            $("#imoInputs > label, #imoInputs > label > input").removeClass('max-w-md');
            $("#editButtons").removeClass('hidden');

            //load dos dados
            const emocao = await db.emocoes.where("id").equals(ide).toArray();
            $("#emocao").val(emocao[0].emocao);
            $("#cor").val(emocao[0].cor);
            $("#estava").val(emocao[0].estava);
            $("#senti").val(emocao[0].senti);
            $("#pensei").val(emocao[0].pensei);

            $("#remover").on('click', function (e) {
                e.preventDefault();

                Swal.fire({
                    title: "Tem a certeza?",
                    text: "Irá apagar o registo definitivamente",
                    icon: "question",
                    showCancelButton: true,
                    confirmButtonColor: "#d33",
                    cancelButtonColor: "#3085d6",
                    confirmButtonText: "Apagar",
                    cancelButtonText: "Cancelar"
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        const deleteCount = await db.emocoes.where("id").equals(ide).delete();
                        if (deleteCount > 0)  {
                            window.location.href = '/emocoes.html';
                        }
                        else {
                            Toast.fire({
                                icon: "error",
                                title: "Ocorreu um erro ao apagar o registo"
                            });
                        }
                    }
                });
            });
            $("#voltar").attr('href', $("#voltar").attr('href') + "#" + String(ide));
        }
        else {
            $("#newButtons").removeClass('hidden');

            if (emocoes.size > 0) {
                $("#emoSelect, div.divider").removeClass('hidden');
            }
        }

        if (emocoes.size === 0 || ide === 0) {
            $("#emocao, #cor").parent().removeClass('max-w-md');
        }

        $("#emoForm").on('submit', async function (e) {
            e.preventDefault();
            let result, message = '';
            const self = $(this);
            const formDataArray = await self.serializeArray().reduce((accumulator, value) => {
                accumulator[value.name] = value.value;
                return accumulator;
            }, {});

            if (ide > 0) {
                result  = await db.emocoes.update(ide, formDataArray);
                message = ((result === 0)
                    ? 'Ocorreu um erro'
                    : 'Emoção alterada com sucesso'
                );
            }
            else {
                formDataArray.data = new Date();
                result             = await db.emocoes.add(formDataArray);
                message            = ((result === 0)
                    ? 'Ocorreu um erro'
                    : 'Emoção adicionada com sucesso'
                );

                if (result !== 0) {
                    window.location.href = '/emocoes.html#' + String(result);
                }
            }

            Toast.fire({
                icon: (result === 0 ? "error" : "success") ,
                title: message
            });
        });
    }
});