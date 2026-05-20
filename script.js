const cores = [
    '#e74c3c', '#2ecc71', '#3498db', '#9b59b6', '#f1c40f', 
    '#e67e22', '#1abc9c', '#34495e', '#ff7979', '#badc58',
    '#22a6b3', '#be2edd', '#f0932b', '#eb4d4b', '#6ab04c',
    '#4834d4', '#130f40', '#30336b', '#ffbe76', '#e056fd'
];

let instructionsData = [];
let simTimer = null;
let cicloAtual = 0;
let vias = 1;

// Atualiza label do slider
document.getElementById('instCount').addEventListener('input', function() {
    document.getElementById('instValue').innerText = this.value;
    prepararCenario(); // Atualiza os blocos ao mover o slider
});

// Atualiza cenário se mudar a via antes de iniciar
document.getElementById('pipelineWidth').addEventListener('change', prepararCenario);

document.getElementById('startBtn').addEventListener('click', function() {
    iniciarSimulacao();
});

// Função que cria os blocos na posição inicial (Fila)
function prepararCenario() {
    if (simTimer) clearInterval(simTimer);
    document.getElementById('startBtn').disabled = false;
    document.getElementById('cycleDisplay').innerText = "0";
    cicloAtual = 0;
    vias = parseInt(document.getElementById('pipelineWidth').value);
    
    const numInstrucoes = parseInt(document.getElementById('instCount').value);
    const simArea = document.getElementById('simArea');
    
    // Remove os blocos antigos
    const blocosAntigos = document.querySelectorAll('.instruction');
    blocosAntigos.forEach(b => b.remove());

    instructionsData = [];

    for (let i = 0; i < numInstrucoes; i++) {
        // Cria o elemento visual HTML
        let el = document.createElement('div');
        el.className = 'instruction';
        el.innerText = 'I' + (i + 1);
        el.style.backgroundColor = cores[i % cores.length];
        
        // Texto escuro para cores claras
        if(['#f1c40f', '#badc58', '#ffbe76'].includes(cores[i % cores.length])) {
            el.style.color = '#333';
        }

        simArea.appendChild(el);

        // Guarda o estado: -1 (Fila), 0 (Busca), 1 (Decod), 2 (Exec), 3 (Escr), 4 (Fim)
        instructionsData.push({
            id: i,
            stage: -1, 
            element: el
        });
    }

    atualizarPosicoesVisuais();
}

// Calcula a posição XY de cada bloco baseado no estágio atual dele
function atualizarPosicoesVisuais() {
    const simArea = document.getElementById('simArea');
    const areaWidth = simArea.clientWidth;
    const stageWidth = areaWidth / 6; // Temos 6 colunas visuais

    // Contadores para empilhar blocos que estão no mesmo estágio
    const counts = { '-1': 0, '0': 0, '1': 0, '2': 0, '3': 0, '4': 0 };

    instructionsData.forEach(inst => {
        let s = inst.stage.toString();
        let indexNoEstagio = counts[s];
        counts[s]++;

        let x, y;
        
        // Centro horizontal da coluna atual (estágio -1 fica na coluna 0, etc)
        let columnCenter = (inst.stage + 1) * stageWidth + (stageWidth / 2);

        if (inst.stage === -1 || inst.stage === 4) {
            // Na "Fila" e no "Finalizado", agrupamos os blocos em um grid 3xN para não vazar a tela
            let col = indexNoEstagio % 3;
            let row = Math.floor(indexNoEstagio / 3);
            let offsetX = (col - 1) * 38; // Espaçamento horizontal
            x = columnCenter + offsetX - 18; // 18 é a metade da largura do bloco (36px)
            y = 70 + row * 40; // Espaçamento vertical
        } else {
            // Nos estágios do pipeline, empilhamos em uma única coluna
            x = columnCenter - 18; 
            y = 75 + indexNoEstagio * 42; 
        }
        
        // Aplica via CSS para a animação ocorrer
        inst.element.style.left = x + 'px';
        inst.element.style.top = y + 'px';
    });
}

function iniciarSimulacao() {
    document.getElementById('startBtn').disabled = true;

    // O pulso do Clock! Roda a cada 900ms para dar tempo da animação CSS acontecer
    simTimer = setInterval(() => {
        let todasFinalizadas = instructionsData.every(i => i.stage === 4);
        if (todasFinalizadas) {
            clearInterval(simTimer);
            document.getElementById('startBtn').disabled = false;
            return;
        }

        cicloAtual++;
        document.getElementById('cycleDisplay').innerText = cicloAtual;

        // Lógica de Movimentação no Pipeline:
        // 1. Movemos quem já está na esteira para frente (de trás pra frente para não atropelar)
        instructionsData.forEach(inst => {
            if (inst.stage >= 0 && inst.stage <= 3) {
                inst.stage++;
            }
        });

        // 2. Colocamos blocos novos da fila na "Busca", respeitando o limite de Vias (Grau Superescalar)
        let instrucoesBuscadasNesseCiclo = 0;
        for (let i = 0; i < instructionsData.length; i++) {
            if (instructionsData[i].stage === -1 && instrucoesBuscadasNesseCiclo < vias) {
                instructionsData[i].stage = 0; // Entra na Busca
                instrucoesBuscadasNesseCiclo++;
            }
        }

        // 3. Atualizamos a tela com as novas posições
        atualizarPosicoesVisuais();

    }, 900); 
}

// Prepara o cenário na primeira vez que a página carrega
window.onload = prepararCenario;

// Se redimensionar a janela, recalcula as posições para não quebrar
window.onresize = atualizarPosicoesVisuais;