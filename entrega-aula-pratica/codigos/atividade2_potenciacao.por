/*
 * Atividade 2 - Potenciacao
 * Disciplina: Algoritmos e Programacao Estruturada
 * Unidade 4 - Secao 3: Passagem de Dados em Programacao
 *
 * Objetivo: calcular A elevado a B (A^B) para inteiros positivos,
 * sem funcao pronta de potenciacao, usando uma repeticao com teste
 * no inicio (enquanto). A^B e obtido multiplicando A por ele mesmo
 * B vezes.
 */
programa {
  funcao inicio() {
    // A = base, B = expoente, resultado = acumulador, contador = controle do laco
    inteiro a, b, resultado, contador

    // Entrada de dados
    escreva("Informe o numero inteiro positivo A (base): ")
    leia(a)
    escreva("Informe o numero inteiro positivo B (expoente): ")
    leia(b)

    // Validacao: o enunciado exige A e B inteiros positivos
    se (a <= 0 ou b <= 0) {
      escreva("Entrada invalida: A e B devem ser inteiros positivos.\n")
    } senao {
      // Inicializacao do acumulador (elemento neutro da multiplicacao)
      resultado = 1
      contador = 1

      // Repeticao com teste no inicio: multiplica A por B vezes
      enquanto (contador <= b) {
        resultado = resultado * a
        contador = contador + 1
      }

      // Saida de dados
      escreva(a, " elevado a ", b, " = ", resultado, "\n")
    }
  }
}
