/*
 * Atividade 1 - Maioridade
 * Disciplina: Algoritmos e Programacao Estruturada
 * Unidade 4 - Secao 3: Passagem de Dados em Programacao
 *
 * Objetivo: ler a idade do usuario e informar se ele e maior ou
 * menor de idade, usando uma estrutura condicional.
 */
programa {
  funcao inicio() {
    // Declaracao da variavel que guarda a idade informada
    inteiro idade

    // Entrada de dados
    escreva("Informe a sua idade: ")
    leia(idade)

    // Processamento e saida: idade >= 18 -> maior de idade
    se (idade >= 18) {
      escreva("Maior de idade\n")
    } senao {
      escreva("Menor de idade\n")
    }
  }
}
