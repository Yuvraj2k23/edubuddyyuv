export const LEVELS = [
  {
    id: 'eli5',
    label: 'ELI5 Beginner',
    shortLabel: 'Beginner',
    badge: 'Level 1',
    tagline: 'Simple analogies & zero jargon',
    color: '#10b981',
  },
  {
    id: 'highschool',
    label: 'High School',
    shortLabel: 'Intermediate',
    badge: 'Level 2',
    tagline: 'Clear intuition & step-by-step logic',
    color: '#3b82f6',
  },
  {
    id: 'undergrad',
    label: 'Undergraduate',
    shortLabel: 'Advanced',
    badge: 'Level 3',
    tagline: 'Formal concepts, formulas & mechanics',
    color: '#8b5cf6',
  },
  {
    id: 'deepdive',
    label: 'Exam Mastery',
    shortLabel: 'Mastery',
    badge: 'Level 4',
    tagline: 'Edge cases, derivations & exam traps',
    color: '#f59e0b',
  },
];

export const SUBJECTS = [
  'All',
  'Computer Science',
  'Physics',
  'Biology',
  'Mathematics',
  'Economics',
  'History',
];

export const TOPICS = [
  {
    id: 'neural-networks',
    title: 'Neural Networks & Backpropagation',
    subject: 'Computer Science',
    difficulty: 'Core AI',
    estimatedMinutes: 12,
    tags: ['AI', 'Deep Learning', 'Gradient Descent', 'ML'],
    levels: {
      eli5: {
        headline: 'Teaching a computer like teaching a kid to recognize cats',
        summary:
          'A neural network is a giant team of tiny decision-makers stacked in layers. When it guesses wrong, backpropagation sends a friendly note backward through the team saying who needs to adjust their guess slightly next time.',
        steps: [
          {
            title: '1. Look at clues (Input Layer)',
            detail: 'The first layer looks at simple clues—like pointy ears, whiskers, or bright pixels in a photo.',
          },
          {
            title: '2. Pass votes forward (Hidden Layers)',
            detail: 'Each helper combines clues and passes a confidence score to the next layer until a final guess is made.',
          },
          {
            title: '3. Check the mistake (Loss)',
            detail: 'We compare the guess ("dog") with the truth ("cat") to measure how far off it was.',
          },
          {
            title: '4. Learn backward (Backpropagation)',
            detail: 'Starting from the mistake, each helper adjusts how much it trusts each clue so it does better next round.',
          },
        ],
        analogy:
          'Imagine cooking soup with 5 chefs in a line. If the final taster says "too salty!", feedback travels backward so the chef who added salt reduces it next time—not the chef who chopped carrots.',
        formulaOrRule: 'Better Guess = Old Guess − (Learning Step × Mistake Blame)',
        commonMistake:
          'Thinking neural networks actually "think" like human brains. They are really just doing millions of tiny weighted number adjustments.',
      },
      highschool: {
        headline: 'Layered weighted equations that auto-tune themselves from errors',
        summary:
          'An artificial neural network transforms inputs through layers of connected nodes (neurons). Each connection has a weight. Backpropagation uses the chain rule to figure out how much each weight contributed to the error, then nudges it to reduce that error.',
        steps: [
          {
            title: '1. Forward Pass',
            detail: 'Multiply inputs by weights, add a bias, and pass the result through an activation function (like ReLU) to introduce non-linearity.',
          },
          {
            title: '2. Compute Loss',
            detail: 'A loss function (like Mean Squared Error or Cross-Entropy) turns the prediction error into a single number to minimize.',
          },
          {
            title: '3. Backward Pass (Chain Rule)',
            detail: 'Calculate how sensitive the loss is to every weight, moving from the output layer back to the input layer.',
          },
          {
            title: '4. Gradient Descent Update',
            detail: 'Move each weight slightly downhill in the direction that lowers the loss, controlled by the learning rate.',
          },
        ],
        analogy:
          'Like tuning dozens of audio mixer sliders while blindfolded: after listening to how off the sound is, you figure out which slider affects the error most and nudge it slightly.',
        formulaOrRule: 'y = Activation(w₁x₁ + w₂x₂ + ... + b)  |  w_new = w_old − η · (∂Loss / ∂w)',
        commonMistake:
          'Setting the learning rate too high—the network keeps overshooting the minimum error instead of settling into it.',
      },
      undergrad: {
        headline: 'Differentiable computational graphs optimized via reverse-mode autodiff',
        summary:
          'A multilayer perceptron composes affine transformations with non-linear activation functions to approximate arbitrary continuous functions (Universal Approximation Theorem). Backpropagation is reverse-mode automatic differentiation that computes exact gradients ∇_θ L in O(1) passes proportional to forward compute.',
        steps: [
          {
            title: '1. Vectorized Forward Propagation',
            detail: 'For each layer l: z^(l) = W^(l) a^(l-1) + b^(l), then a^(l) = σ(z^(l)). Activations are cached for the backward pass.',
          },
          {
            title: '2. Output Layer Error Signal',
            detail: 'Compute δ^(L) = ∂L/∂z^(L). For softmax + cross-entropy, this simplifies cleanly to δ^(L) = ŷ − y.',
          },
          {
            title: '3. Recursive Gradient Propagation',
            detail: 'Propagate δ^(l) = ((W^(l+1))^T δ^(l+1)) ⊙ σ\'(z^(l)) using Hadamard product, yielding ∂L/∂W^(l) = δ^(l) (a^(l-1))^T.',
          },
          {
            title: '4. Optimizer Step & Regularization',
            detail: 'Apply Adam/SGD with momentum, weight decay (L2), or dropout to stabilize convergence and prevent overfitting.',
          },
        ],
        analogy:
          'Reverse-mode autodiff is like tracing sensitivity in a supply chain from final retail price backward—one backward sweep gives sensitivities for every raw material simultaneously.',
        formulaOrRule: 'δ^(l) = ((W^(l+1))ᵀ δ^(l+1)) ⊙ σ\'(z^(l))   |   ∂L/∂W^(l) = δ^(l) (a^(l-1))ᵀ',
        commonMistake:
          'Forgetting why non-linear activations are mandatory: stacking linear layers without σ(·) collapses into a single linear matrix multiplication.',
      },
      deepdive: {
        headline: 'Gradient pathologies, Jacobians, and modern stabilization tricks',
        summary:
          'Deep backpropagation multiplies many layer Jacobians together. If singular values consistently fall below or above 1, gradients vanish or explode exponentially with depth. Modern deep learning relies on residual connections, normalization, and careful initialization to preserve gradient norms.',
        steps: [
          {
            title: '1. Vanishing & Exploding Gradients',
            detail: 'Sigmoid derivatives peak at 0.25, causing 0.25^L decay across L layers. ReLU avoids saturation for z > 0 but introduces "dying ReLU" when z ≤ 0.',
          },
          {
            title: '2. Residual Highway Gradients',
            detail: 'Skip connections y = x + F(x) give ∂y/∂x = I + ∂F/∂x, guaranteeing an unimpeded identity gradient path back to early layers.',
          },
          {
            title: '3. Initialization & Normalization',
            detail: 'He/Xavier initialization preserves activation variance across layers; BatchNorm/LayerNorm smooths the loss landscape.',
          },
          {
            title: '4. Exam & Interview Trap',
            detail: 'Backpropagation is ONLY the algorithm for computing gradients—NOT the optimizer itself. SGD/Adam uses those gradients to update weights.',
          },
        ],
        analogy:
          'Without residual skip connections, passing a whispered message through 100 people distorts it beyond recognition. Skip connections give earlier people a direct intercom line.',
        formulaOrRule: '∂L/∂x_l = (∂L/∂x_L) · (1 + ∂/∂x_l ∑ F(x_i, W_i))',
        commonMistake:
          'Confusing backpropagation with gradient descent on exams, or initializing all weights to zero (which breaks symmetry so every neuron learns the exact same feature).',
      },
    },
    conceptMap: {
      center: 'Neural Network',
      nodes: [
        { label: 'Weights & Biases', role: 'Learnable Parameters', detail: 'Numeric knobs tuned during training to capture patterns.' },
        { label: 'Activation (ReLU)', role: 'Non-Linearity', detail: 'Allows networks to learn curves and complex boundaries.' },
        { label: 'Loss Function', role: 'Error Scorecard', detail: 'Measures the gap between predicted and true outputs.' },
        { label: 'Chain Rule', role: 'Backprop Engine', detail: 'Distributes error blame backward layer by layer.' },
        { label: 'Optimizer (SGD/Adam)', role: 'Weight Updater', detail: 'Uses computed gradients to step downhill.' },
      ],
    },
    resources: [
      {
        title: 'But what is a Neural Network? (Visual Series)',
        type: 'Video',
        platform: '3Blue1Brown',
        duration: '19 min',
        level: 'eli5',
        url: 'https://www.youtube.com/watch?v=aircAruvnKk',
        whyItFits: 'Zero-jargon animated visual intuition of layers and activations.',
      },
      {
        title: 'TensorFlow Playground — Interactive Neural Net Sandbox',
        type: 'Interactive',
        platform: 'TensorFlow',
        duration: '15 min',
        level: 'highschool',
        url: 'https://playground.tensorflow.org/',
        whyItFits: 'Tweak layers, learning rates, and activations live in your browser.',
      },
      {
        title: 'CS231n: Backpropagation & Computational Graphs',
        type: 'Reading Guide',
        platform: 'Stanford CS231n',
        duration: '25 min',
        level: 'undergrad',
        url: 'https://cs231n.github.io/optimization-2/',
        whyItFits: 'Crystal-clear matrix derivatives and local gradient intuition.',
      },
      {
        title: 'Micrograd: Build Autograd from Scratch in 100 Lines',
        type: 'Practice',
        platform: 'Andrej Karpathy',
        duration: '45 min',
        level: 'deepdive',
        url: 'https://github.com/karpathy/micrograd',
        whyItFits: 'Implement reverse-mode autodiff yourself to achieve total exam mastery.',
      },
    ],
    quiz: [
      {
        level: 'eli5',
        question: 'What is the main job of backpropagation during training?',
        options: [
          'Delete incorrect training images from the dataset',
          'Calculate how much each weight contributed to the prediction error',
          'Add more layers automatically whenever accuracy drops',
          'Convert images into text labels before the forward pass',
        ],
        correctIndex: 1,
        hint: 'Think of the soup chefs analogy—who gets feedback on how much to adjust?',
        explanation: 'Backpropagation computes the gradient of the loss with respect to each weight so the optimizer knows how to adjust them.',
      },
      {
        level: 'highschool',
        question: 'Why do neural networks need non-linear activation functions like ReLU?',
        options: [
          'To make matrix multiplication run faster on CPUs',
          'Because without them, multiple layers collapse into a single linear equation',
          'To prevent the loss function from ever becoming positive',
          'Because Python cannot multiply negative numbers without ReLU',
        ],
        correctIndex: 1,
        hint: 'What happens when you plug one straight-line equation y = mx + b into another?',
        explanation: 'A composition of linear transformations is still purely linear. Non-linear activations allow networks to model curved, complex decision boundaries.',
      },
      {
        level: 'undergrad',
        question: 'What happens if you initialize EVERY weight in a neural network to 0?',
        options: [
          'The network converges twice as fast',
          'All neurons in a layer compute identical gradients and stay symmetric',
          'Backpropagation causes division by zero immediately',
          'The bias terms automatically break symmetry for every weight',
        ],
        correctIndex: 1,
        hint: 'If two neurons start with the exact same inputs and weights, will they ever become different?',
        explanation: 'Zero initialization causes symmetry: every hidden unit receives the exact same gradient update, defeating the purpose of having multiple neurons.',
      },
      {
        level: 'deepdive',
        question: 'How do Residual (Skip) Connections y = x + F(x) mitigate vanishing gradients?',
        options: [
          'By replacing backpropagation with random search',
          'By providing an additive identity path (∂y/∂x = I + ∂F/∂x) for gradients',
          'By clamping all activations strictly between 0 and 0.25',
          'By removing the need for a loss function',
        ],
        correctIndex: 1,
        hint: 'Differentiate y = x + F(x) with respect to x.',
        explanation: 'The +1 (identity matrix) term lets gradients flow directly to earlier layers even when ∂F/∂x is very small.',
      },
    ],
    flashcards: [
      {
        front: 'What is the difference between Backpropagation and Gradient Descent?',
        back: 'Backpropagation COMPUTES the gradients using the chain rule. Gradient Descent USES those gradients to update the weights.',
        mnemonic: 'Backprop = Diagnosis; Gradient Descent = Medicine.',
      },
      {
        front: 'Why can Sigmoid activations cause vanishing gradients in deep networks?',
        back: 'The maximum derivative of σ(z) is only 0.25 (at z=0). Multiplying many numbers ≤ 0.25 across layers shrinks gradients exponentially toward 0.',
        mnemonic: '0.25 × 0.25 × 0.25... shrinks fast like shrinking a photo by 75% repeatedly.',
      },
      {
        front: 'What is the Learning Rate (η) controlling?',
        back: 'The step size taken opposite to the gradient during each weight update. Too small = painfully slow; too large = overshooting and divergence.',
        mnemonic: 'Big strides jump over the valley; tiny steps take forever to walk down.',
      },
      {
        front: 'What is Overfitting in a Neural Network?',
        back: 'When the model memorizes training data noise (low training loss) but fails to generalize to unseen test data (high validation loss).',
        mnemonic: 'Memorizing the practice exam word-for-word instead of understanding the concepts.',
      },
    ],
  },
  {
    id: 'dynamic-programming',
    title: 'Dynamic Programming (DP)',
    subject: 'Computer Science',
    difficulty: 'Algorithms',
    estimatedMinutes: 14,
    tags: ['DSA', 'Memoization', 'Recursion', 'Interviews'],
    levels: {
      eli5: {
        headline: 'Remembering your past math answers so you never redo the same work',
        summary:
          'Dynamic Programming sounds scary, but it literally just means: solve a big puzzle by solving tiny pieces AND writing down the answers in a notebook so you never waste time solving the same tiny piece twice.',
        steps: [
          {
            title: '1. Notice repeated work',
            detail: 'If someone asks "What is 1+1+1+1+1?" you count 5. If they add "+1", you don\'t recount from scratch—you remember 5 and say 6!',
          },
          {
            title: '2. Break into smaller steps',
            detail: 'To climb to step 10, you must have just come from step 9 or step 8.',
          },
          {
            title: '3. Keep a cheat-sheet notebook',
            detail: 'Every time you figure out a smaller step, write it down in a table.',
          },
          {
            title: '4. Build up to the final answer',
            detail: 'Read your saved answers to get the big solution in milliseconds instead of hours.',
          },
        ],
        analogy:
          'Like saving your video game at checkpoints. Instead of replaying Level 1 through Level 9 every time you face the boss on Level 10, you load your saved progress.',
        formulaOrRule: 'Dynamic Programming = Smart Recursion + Saving Answers (Caching)',
        commonMistake:
          'Trying to memorize DP code templates instead of first asking: "What smaller sub-question am I solving repeatedly?"',
      },
      highschool: {
        headline: 'Turning exponential brute-force recursion into fast polynomial solutions',
        summary:
          'DP applies when a problem has two properties: Overlapping Subproblems (same sub-task appears repeatedly) and Optimal Substructure (best overall answer is built from best smaller answers). You can code it Top-Down (Memoization) or Bottom-Up (Tabulation).',
        steps: [
          {
            title: '1. Define the State',
            detail: 'Decide what dp[i] represents in plain English (e.g., "minimum coins needed to make amount i").',
          },
          {
            title: '2. Find the Transition',
            detail: 'Write how dp[i] depends on earlier states—like dp[i] = 1 + min(dp[i - coin]).',
          },
          {
            title: '3. Set Base Cases',
            detail: 'Define the smallest trivial answers (e.g., dp[0] = 0 coins needed to make amount 0).',
          },
          {
            title: '4. Choose Memoization or Tabulation',
            detail: 'Memoization adds a dictionary cache to recursion; Tabulation fills an array with a loop.',
          },
        ],
        analogy:
          'Calculating driving distances from your house to every city: once you know the shortest path to City A, every route passing through City A reuses that shortest path.',
        formulaOrRule: 'Fibonacci: F(n) = F(n-1) + F(n-2)  |  Naive: O(2ⁿ) → With DP: O(n)',
        commonMistake:
          'Confusing Greedy algorithms with DP. Greedy locks in the local best choice immediately (which fails on Coin Change for coins [1, 3, 4], target 6), whereas DP checks all valid sub-choices.',
      },
      undergrad: {
        headline: 'DAG shortest-path formulation over state spaces with space optimization',
        summary:
          'Every DP problem defines a Directed Acyclic Graph (DAG) of subproblems where edges represent state transitions. Top-down memoization traverses the DAG via DFS; bottom-up tabulation evaluates states in topological order, often enabling O(n) → O(1) rolling-array space compression.',
        steps: [
          {
            title: '1. Formalize State Tuple',
            detail: 'Identify minimal state parameters sufficient to satisfy the Markov property (future choices depend only on current state, not full history).',
          },
          {
            title: '2. Recurrence & Complexity',
            detail: 'Time complexity = (# of unique states) × (work per transition). Space = (# of states stored concurrently).',
          },
          {
            title: '3. Topological Evaluation Order',
            detail: 'Ensure all dependencies of state s are computed before s. For 0/1 Knapsack 1D optimization, iterate capacity backward.',
          },
          {
            title: '4. Reconstruct the Solution',
            detail: 'Store parent pointers or backtrack through the DP table to recover the actual path/subset, not just the scalar optimum.',
          },
        ],
        analogy:
          'Solving a DP table is mathematically identical to finding the shortest (or longest) path in a DAG layered by problem size.',
        formulaOrRule: '0/1 Knapsack: dp[i][w] = max(dp[i-1][w], val[i] + dp[i-1][w - wt[i]])',
        commonMistake:
          'Iterating forward instead of backward in 1D 0/1 Knapsack—which accidentally turns 0/1 Knapsack into Unbounded Knapsack (reusing the same item multiple times).',
      },
      deepdive: {
        headline: 'Bitmask DP, Tree DP, and Convex Hull / Divide-and-Conquer optimizations',
        summary:
          'At competitive programming and graduate algorithm exams, DP expands beyond 1D/2D grids into state-compression bitmasks (TSP in O(n²2ⁿ)), rerooting on trees, digit DP, and transition optimizations that drop O(n³) recurrences down to O(n² log n) or O(n).',
        steps: [
          {
            title: '1. Bitmask State Compression',
            detail: 'Encode subsets of n ≤ 20 items as an integer bitmask (0 to 2ⁿ-1) for Traveling Salesperson and Hamiltonian paths.',
          },
          {
            title: '2. Interval & Matrix Chain DP',
            detail: 'Iterate by interval length len = 2..n so dp[l][r] splits cleanly at k ∈ [l, r-1].',
          },
          {
            title: '3. Detecting Non-DP Cycles',
            detail: 'If subproblem dependencies form a cycle, plain DP fails—you must switch to Dijkstra, Bellman-Ford, or Gaussian Elimination.',
          },
          {
            title: '4. Exam Proof Checklist',
            detail: 'Always prove Optimal Substructure via cut-and-paste contradiction and explicitly state base cases, recurrence, order, and complexity.',
          },
        ],
        analogy:
          'Advanced DP is like compressing a huge map into coordinates so only the essential summary of where you have been matters for where you can go next.',
        formulaOrRule: 'Time = |States| × |Transitions|  |  TSP Bitmask: dp[mask][u] = min(dp[mask ^ (1<<u)][v] + dist[v][u])',
        commonMistake:
          'Attempting DP when optimal substructure fails (e.g., Longest Simple Path in a general graph with cycles).',
      },
    },
    conceptMap: {
      center: 'Dynamic Programming',
      nodes: [
        { label: 'Overlapping Subproblems', role: 'Condition 1', detail: 'Same smaller problem gets recalculated multiple times.' },
        { label: 'Optimal Substructure', role: 'Condition 2', detail: 'Optimal global solution combines optimal sub-solutions.' },
        { label: 'Memoization', role: 'Top-Down', detail: 'Recursion + HashMap/Array cache.' },
        { label: 'Tabulation', role: 'Bottom-Up', detail: 'Iterative table filling in dependency order.' },
        { label: 'Space Optimization', role: 'Rolling State', detail: 'Keep only previous row/variables to slash memory.' },
      ],
    },
    resources: [
      {
        title: 'Dynamic Programming Illustrated Visually',
        type: 'Video',
        platform: 'Reducible',
        duration: '20 min',
        level: 'eli5',
        url: 'https://www.youtube.com/watch?v=5dRGRueKU3M',
        whyItFits: 'Shows the recursion tree collapsing visually into a DAG.',
      },
      {
        title: 'NeetCode 1D & 2D DP Roadmap',
        type: 'Practice',
        platform: 'NeetCode',
        duration: '30 min',
        level: 'highschool',
        url: 'https://neetcode.io/roadmap',
        whyItFits: 'Curated progression from Climbing Stairs to Coin Change.',
      },
      {
        title: 'MIT 6.006 Dynamic Programming Lecture Notes',
        type: 'Reading Guide',
        platform: 'MIT OCW',
        duration: '35 min',
        level: 'undergrad',
        url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/',
        whyItFits: 'The famous SRTBOT framework (Subproblems, Relate, Topo order, Base, Original, Time).',
      },
      {
        title: 'CSES Dynamic Programming Problem Set',
        type: 'Practice',
        platform: 'CSES',
        duration: '60 min',
        level: 'deepdive',
        url: 'https://cses.fi/problemset/',
        whyItFits: 'Gold-standard benchmark problems for competitive & exam mastery.',
      },
    ],
    quiz: [
      {
        level: 'eli5',
        question: 'Which TWO ingredients signal that a problem is a great fit for Dynamic Programming?',
        options: [
          'Sorted arrays and binary trees',
          'Overlapping subproblems and optimal substructure',
          'Random numbers and hash collisions',
          'Infinite loops and pointer arithmetic',
        ],
        correctIndex: 1,
        hint: 'Think: repeated tiny questions + building the best big answer from best small answers.',
        explanation: 'DP saves time because subproblems overlap (caching avoids recomputation) and works accurately because optimal sub-answers build the optimal full answer.',
      },
      {
        level: 'highschool',
        question: 'Using coins {1, 3, 4} to make target 6, why does Greedy fail while DP succeeds?',
        options: [
          'Greedy picks 4+1+1 (3 coins), while DP discovers 3+3 (2 coins)',
          'Greedy cannot handle odd coin denominations',
          'DP uses fewer variables than Greedy',
          'Greedy always takes O(2ⁿ) time',
        ],
        correctIndex: 0,
        hint: 'Trace what the largest-coin-first rule picks for 6.',
        explanation: 'Greedy greedily grabs 4 leaving 2 (1+1 → 3 coins total). DP evaluates all choices and finds 3+3 = 2 coins.',
      },
      {
        level: 'undergrad',
        question: 'In 1D space-optimized 0/1 Knapsack, why must we iterate capacity w from W down to wt[i]?',
        options: [
          'To avoid out-of-bounds array errors',
          'So dp[w - wt[i]] still holds the previous item row rather than the already-updated current row',
          'Because backward loops run faster in C++ and Python',
          'To maximize the number of items picked regardless of value',
        ],
        correctIndex: 1,
        hint: 'What happens if dp[w - wt[i]] was already updated in the current item iteration?',
        explanation: 'Iterating backward preserves values from row (i-1). Iterating forward would allow picking item i multiple times (unbounded knapsack).',
      },
    ],
    flashcards: [
      {
        front: 'Top-Down (Memoization) vs Bottom-Up (Tabulation)?',
        back: 'Memoization starts from the big problem using recursion + cache. Tabulation builds iteratively from base cases up with no recursion stack overhead.',
        mnemonic: 'Memo = Recursive + Cache; Table = Loops from Base.',
      },
      {
        front: 'What is the SRTBOT framework for solving any DP problem?',
        back: 'Subproblems → Relate (recurrence) → Topological order → Base cases → Original problem → Time complexity.',
        mnemonic: 'Super Robots Trade Batteries On Time.',
      },
      {
        front: 'When does DP NOT work even if you can write a recurrence?',
        back: 'When subproblem dependencies contain cycles (not a DAG) or when optimal substructure does not hold.',
        mnemonic: 'No DAG = No DP.',
      },
    ],
  },
  {
    id: 'quantum-entanglement',
    title: 'Quantum Entanglement',
    subject: 'Physics',
    difficulty: 'Modern Physics',
    estimatedMinutes: 10,
    tags: ['Quantum Mechanics', 'Bell State', 'Superposition'],
    levels: {
      eli5: {
        headline: 'A pair of magic coins that always match, even across galaxies',
        summary:
          'Imagine two special quantum coins created together. Before you look, neither coin has chosen heads or tails. The instant you look at your coin on Earth and see Heads, your friend on Mars is guaranteed to see Tails—every single time!',
        steps: [
          {
            title: '1. Born as a linked pair',
            detail: 'Two tiny particles interact so closely that physics describes them as ONE shared system, not two separate marbles.',
          },
          {
            title: '2. Undecided until measured',
            detail: 'While flying apart, both particles exist in a fuzzy mix of possibilities (superposition).',
          },
          {
            title: '3. Instant correlation on lookup',
            detail: 'Measuring Particle A immediately locks in the corresponding state of Particle B, no matter the distance.',
          },
          {
            title: '4. No faster-than-light texting!',
            detail: 'Because your result is random (50/50), you cannot force it to send a secret message faster than light.',
          },
        ],
        analogy:
          'Put a left shoe and right shoe in two identical closed boxes and mail one to Tokyo. The moment you open your box in Delhi and see the Left shoe, you instantly know Tokyo has the Right shoe—except in quantum physics, neither shoe decided which foot it was until you looked!',
        formulaOrRule: 'Entangled Pair = One Shared Quantum State across Two Locations',
        commonMistake:
          'Believing entanglement lets humans send instant faster-than-light messages (it cannot—the No-Communication Theorem forbids it).',
      },
      highschool: {
        headline: 'Non-separable quantum states with stronger-than-classical correlations',
        summary:
          'Entanglement happens when two particles share a single quantum wavefunction that cannot be factored into independent descriptions for each particle. Measuring one particle\'s spin or polarization instantly determines the partner\'s outcome—and Bell\'s experiments prove these values weren\'t secretly pre-decided.',
        steps: [
          {
            title: '1. Creating Entangled Photons',
            detail: 'Laser light passing through a special crystal (SPDC) splits one photon into two entangled photons with linked polarizations.',
          },
          {
            title: '2. Conservation Laws Link Them',
            detail: 'If total spin is zero, measuring Spin-Up on Particle A means Particle B must be Spin-Down along the same axis.',
          },
          {
            title: '3. Hidden Variables Disproved',
            detail: 'Einstein thought particles carried hidden instructions ("gloves in boxes"). John Bell devised a statistical test—and nature violated Bell\'s inequality!',
          },
          {
            title: '4. Real-World Tech',
            detail: 'Powers Quantum Key Distribution (unhackable cryptography) and quantum computing speedups.',
          },
        ],
        analogy:
          'Two synchronized dice rolled in separate cities that ALWAYS sum to 7, even though each individual die still looks completely random (1–6) on its own.',
        formulaOrRule: '|Φ⁺⟩ = (|00⟩ + |11⟩) / √2   (50% both 0, 50% both 1)',
        commonMistake:
          'Thinking the shoe-in-a-box analogy is 100% accurate. Shoes were already Left/Right before opening; quantum particles genuinely lack definite local values beforehand.',
      },
      undergrad: {
        headline: 'Non-factorizable bipartite states in tensor-product Hilbert spaces',
        summary:
          'A pure bipartite state |ψ⟩ ∈ H_A ⊗ H_B is entangled iff it cannot be written as a single tensor product |φ⟩_A ⊗ |χ⟩_B. Tracing out subsystem B of a maximally entangled Bell state yields a maximally mixed reduced density matrix ρ_A = ½I, showing maximum local entropy despite zero global entropy.',
        steps: [
          {
            title: '1. Separability Test',
            detail: 'For |ψ⟩ = α|00⟩ + β|01⟩ + γ|10⟩ + δ|11⟩, the state is separable iff αδ = βγ; otherwise it is entangled.',
          },
          {
            title: '2. Reduced Density Matrix',
            detail: 'Computing ρ_A = Tr_B(|Φ⁺⟩⟨Φ⁺|) = ½(|0⟩⟨0| + |1⟩⟨1|) proves Bob\'s local statistics never change when Alice measures.',
          },
          {
            title: '3. CHSH Inequality Violation',
            detail: 'Local hidden-variable theories satisfy S ≤ 2; quantum mechanics achieves Tsirelson\'s bound S = 2√2 ≈ 2.828.',
          },
          {
            title: '4. Entanglement Entropy',
            detail: 'Quantified via von Neumann entropy S(ρ_A) = −Tr(ρ_A log₂ ρ_A), equal to 1 ebit for any Bell state.',
          },
        ],
        analogy:
          'You know the entire book completely (global entropy = 0), yet looking at any single page alone looks like pure random static (local entropy = max).',
        formulaOrRule: '|ψ⟩ ≠ |φ⟩_A ⊗ |χ⟩_B  |  CHSH Quantum Bound: S = 2√2 > 2',
        commonMistake:
          'Assuming any superposition is entangled. (|0⟩+|1⟩)/√2 ⊗ |0⟩ = (|00⟩+|10⟩)/√2 is in superposition, yet completely separable (not entangled)!',
      },
      deepdive: {
        headline: 'Schmidt decomposition, monogamy of entanglement, and quantum teleportation',
        summary:
          'Entanglement is a quantifiable physical resource governed by LOCC (Local Operations & Classical Communication). It cannot be increased by LOCC, obeys monogamy (maximal entanglement between A and B precludes entanglement with C), and enables teleporting unknown quantum states using 1 ebit + 2 classical bits.',
        steps: [
          {
            title: '1. Schmidt Rank Criterion',
            detail: 'Any bipartite pure state decomposes as |ψ⟩ = ∑ λ_i |u_i⟩|v_i⟩. It is entangled iff Schmidt rank > 1.',
          },
          {
            title: '2. Quantum Teleportation Protocol',
            detail: 'Alice performs a Bell-basis measurement on her unknown qubit and her half of |Φ⁺⟩, then sends 2 classical bits so Bob applies Pauli X/Z corrections.',
          },
          {
            title: '3. Monogamy (CKW Inequality)',
            detail: 'Concurrence satisfies C²(A:B) + C²(A:C) ≤ C²(A:BC)—which guarantees security against eavesdroppers in QKD.',
          },
          {
            title: '4. Exam Trap: Mixed States',
            detail: 'For mixed states, Schmidt decomposition fails; use PPT (Peres–Horodecki) partial transpose criterion for 2×2 and 2×3 systems.',
          },
        ],
        analogy:
          'Entanglement is like a strictly monogamous bank vault key: if an eavesdropper tries to copy or share the key, the original lock immediately reveals the tampering.',
        formulaOrRule: 'Teleportation Resource Equation: 1 ebit + 2 cbits ≥ 1 qubit',
        commonMistake:
          'Forgetting the 2 classical bits required in quantum teleportation—without them, Bob cannot decode the state, preserving causality.',
      },
    },
    conceptMap: {
      center: 'Quantum Entanglement',
      nodes: [
        { label: 'Superposition', role: 'Ingredient', detail: 'States exist in linear combinations prior to measurement.' },
        { label: 'Bell States', role: 'Max Entanglement', detail: 'Four canonical maximally entangled 2-qubit basis states.' },
        { label: 'Bell Inequality', role: 'Proof', detail: 'Experimental proof ruling out local hidden variables (2022 Nobel).' },
        { label: 'No-Communication', role: 'Speed Limit', detail: 'Local measurement stats remain random; no FTL signaling.' },
        { label: 'QKD & Teleportation', role: 'Applications', detail: 'Quantum encryption and quantum networking.' },
      ],
    },
    resources: [
      {
        title: 'Quantum Entanglement Explained Visually',
        type: 'Video',
        platform: 'Veritasium',
        duration: '14 min',
        level: 'eli5',
        url: 'https://www.youtube.com/watch?v=ZuvK-od647c',
        whyItFits: 'Clearest visual explanation of why Bell\'s experiment broke Einstein\'s intuition.',
      },
      {
        title: 'Quantum Country — Interactive Spaced-Repetition Essay',
        type: 'Interactive',
        platform: 'Quantum Country',
        duration: '25 min',
        level: 'highschool',
        url: 'https://quantum.country/qcvc',
        whyItFits: 'Built-in active recall flashcards while learning qubits and Bell states.',
      },
      {
        title: 'IBM Quantum Learning: Entanglement in Action',
        type: 'Practice',
        platform: 'IBM Quantum',
        duration: '35 min',
        level: 'undergrad',
        url: 'https://learning.quantum.ibm.com/',
        whyItFits: 'Run a real Bell circuit (Hadamard + CNOT) and measure correlations.',
      },
      {
        title: 'Nielsen & Chuang — Ch. 2 Density Operators & Schmidt Decomposition',
        type: 'Reading Guide',
        platform: 'Textbook Reference',
        duration: '45 min',
        level: 'deepdive',
        url: 'https://en.wikipedia.org/wiki/Schmidt_decomposition',
        whyItFits: 'Formal mathematical foundation for university quantum information exams.',
      },
    ],
    quiz: [
      {
        level: 'eli5',
        question: 'Can we use quantum entanglement to send text messages faster than the speed of light?',
        options: [
          'Yes, NASA already uses it for Mars internet',
          'No, because each individual measurement outcome is still random',
          'Yes, as long as the particles stay in a vacuum',
          'Only if you entangle at least three particles',
        ],
        correctIndex: 1,
        hint: 'Can you force your random coin flip to land on Heads?',
        explanation: 'You only see the correlation after comparing results via a regular (sub-light-speed) channel.',
      },
      {
        level: 'undergrad',
        question: 'Which of the following 2-qubit states is NOT entangled (i.e. separable)?',
        options: [
          '(|00⟩ + |11⟩) / √2',
          '(|01⟩ − |10⟩) / √2',
          '(|00⟩ + |10⟩) / √2',
          '(|00⟩ + |01⟩ + |10⟩ − |11⟩) / 2',
        ],
        correctIndex: 2,
        hint: 'Try factoring out |0⟩ from the second qubit!',
        explanation: '(|00⟩ + |10⟩)/√2 factors cleanly into [(|0⟩ + |1⟩)/√2] ⊗ |0⟩, so it is separable.',
      },
    ],
    flashcards: [
      {
        front: 'How do you create a Bell State |Φ⁺⟩ in a quantum circuit?',
        back: 'Start with |00⟩, apply a Hadamard (H) gate to qubit 0, then a CNOT gate with qubit 0 as control and qubit 1 as target.',
        mnemonic: 'H then CNOT ties the quantum knot!',
      },
      {
        front: 'What did Bell\'s Inequality experiments prove?',
        back: 'Nature cannot be explained by Local Hidden Variables—quantum correlations are genuinely non-local.',
        mnemonic: 'Bell rang the alarm on Einstein\'s "hidden gloves".',
      },
    ],
  },
  {
    id: 'crispr-cas9',
    title: 'CRISPR-Cas9 Gene Editing',
    subject: 'Biology',
    difficulty: 'Molecular Bio',
    estimatedMinutes: 11,
    tags: ['Genetics', 'DNA', 'Biotech', 'Cas9'],
    levels: {
      eli5: {
        headline: 'A microscopic "Find & Replace" tool for DNA',
        summary:
          'DNA is the instruction book inside every living cell. CRISPR-Cas9 works like Ctrl+F plus scissors: a GPS tag finds one exact typo in a 3-billion-letter DNA book, scissors snip it out, and the cell pastes in the fixed spelling.',
        steps: [
          {
            title: '1. Write the GPS address (Guide RNA)',
            detail: 'Scientists make a short RNA strip matching the exact DNA letters they want to find.',
          },
          {
            title: '2. Hand it to molecular scissors (Cas9)',
            detail: 'The Cas9 protein holds the guide RNA and scans DNA until it finds an exact match.',
          },
          {
            title: '3. Snip the DNA',
            detail: 'Cas9 makes a clean cut right at the target spot.',
          },
          {
            title: '4. Cell repairs the cut',
            detail: 'The cell either disables the broken gene or copies a healthy replacement template scientists provide.',
          },
        ],
        analogy:
          'Like hitting Ctrl+F in a massive 1,000-page Word document to jump straight to one misspelled word, hitting backspace, and typing the correct word.',
        formulaOrRule: 'Guide RNA (GPS) + Cas9 Protein (Scissors) + Cell Repair = Gene Edit',
        commonMistake:
          'Thinking CRISPR was invented from scratch by humans—it was actually discovered as a natural bacterial immune system against viruses!',
      },
      highschool: {
        headline: 'RNA-guided double-strand DNA cleavage triggering cellular repair pathways',
        summary:
          'Derived from Streptococcus pyogenes bacteria, CRISPR-Cas9 uses a ~20-nucleotide single guide RNA (sgRNA) to direct the Cas9 endonuclease to a complementary DNA target adjacent to a PAM sequence (5\'-NGG-3\'). Cas9 creates a double-strand break (DSB), which cells fix via NHEJ (gene knockout) or HDR (precise insertion).',
        steps: [
          {
            title: '1. PAM Recognition (5\'-NGG-3\')',
            detail: 'Cas9 first looks for a short 3-letter landing pad (PAM) before checking if the neighboring DNA matches the guide RNA.',
          },
          {
            title: '2. R-Loop Formation & Cleavage',
            detail: 'The DNA unwinds, pairs with the sgRNA, and Cas9\'s two nuclease domains (HNH & RuvC) cut both strands 3 bp upstream of PAM.',
          },
          {
            title: '3. NHEJ (Error-Prone Knockout)',
            detail: 'Non-Homologous End Joining glues ends quickly, often causing small insertions/deletions (indels) that switch off a gene.',
          },
          {
            title: '4. HDR (Precision Editing)',
            detail: 'Homology-Directed Repair uses a scientist-supplied donor DNA template to write an exact new genetic sequence.',
          },
        ],
        analogy:
          'PAM is like the airport runway—Cas9 cannot even land to read the street address (guide RNA) unless that runway sequence is right next door.',
        formulaOrRule: 'DSB → NHEJ (Gene Knockout / Indels)  OR  HDR + Donor Template (Precise Edit)',
        commonMistake:
          'Forgetting that Cas9 itself does NOT paste new DNA—the host cell\'s own repair machinery (NHEJ or HDR) performs the actual edit.',
      },
      undergrad: {
        headline: 'Programmable endonuclease kinetics, off-target mitigation & Base/Prime Editing',
        summary:
          'SpCas9 interrogates duplex DNA via PAM-interacting domain scanning, conformational checkpoint activation (REC3 domain), and HNH/RuvC catalysis. Clinical translation focuses on minimizing off-target cleavage in the PAM-distal region and moving beyond DSBs using Cas9 nickases (nCas9) in Base and Prime Editing.',
        steps: [
          {
            title: '1. Seed Sequence Specificity',
            detail: 'Mismatches in the 8–12 nt "seed" region proximal to PAM abolish cleavage, whereas PAM-distal mismatches are more tolerated (off-target risk).',
          },
          {
            title: '2. Cell-Cycle Constraint on HDR',
            detail: 'HDR is largely restricted to S/G2 phases, limiting precise DSB-based editing in post-mitotic cells like neurons or cardiomyocytes.',
          },
          {
            title: '3. Base Editing (CBE / ABE)',
            detail: 'Fuses catalytically impaired nCas9 to a deaminase enzyme to convert C→T or A→G without double-strand breaks.',
          },
          {
            title: '4. Prime Editing (pegRNA + RT)',
            detail: 'Uses nCas9 fused to Reverse Transcriptase guided by a pegRNA to write arbitrary small insertions, deletions, or all 12 point substitutions.',
          },
        ],
        analogy:
          'Classic Cas9 is a pair of scissors; Base Editing is a pencil with an eraser for single letters; Prime Editing is a full word processor that edits without snapping the DNA backbone.',
        formulaOrRule: 'SpCas9 PAM: 5\'-NGG-3\' | Cleavage site: 3 nt upstream of PAM via HNH (target) + RuvC (non-target)',
        commonMistake:
          'Assuming HDR works efficiently in non-dividing cells—that is precisely why Prime & Base Editing were developed.',
      },
      deepdive: {
        headline: 'Delivery bottlenecks, p53 DNA damage response, and CRISPRa/i regulation',
        summary:
          'Beyond editing sequence, catalytically dead Cas9 (dCas9) fused to VP64 or KRAB enables reversible epigenetic transcription activation (CRISPRa) or silencing (CRISPRi). Therapeutic barriers center on AAV packaging limits (~4.7 kb vs SpCas9\'s 4.1 kb), lipid nanoparticle tropism, and DSB-induced chromosomal translocations.',
        steps: [
          {
            title: '1. Epigenetic Control (dCas9)',
            detail: 'Mutating both HNH (H840A) and RuvC (D10A) turns Cas9 into a programmable DNA-binding platform with zero cutting.',
          },
          {
            title: '2. Delivery Constraints',
            detail: 'SpCas9 barely fits inside an AAV vector; smaller orthologs like SaCas9 or Cas12f ease viral packaging.',
          },
          {
            title: '3. Genotoxicity & p53 Selection',
            detail: 'DSBs activate p53 apoptosis; surviving edited cells can inadvertently enrich for p53-deficient clones.',
          },
          {
            title: '4. Approved Clinical Milestone',
            detail: 'Casgevy (exagamglogene autotemcel) edits the BCL11A enhancer via NHEJ to reactivate fetal hemoglobin in Sickle Cell Disease.',
          },
        ],
        analogy:
          'dCas9 is like taking the blades off the scissors and attaching a highlighter or a sticky note to turn genes up or down without ever cutting the page.',
        formulaOrRule: 'dCas9 (D10A + H840A) + KRAB = CRISPRi  |  dCas9 + VP64 = CRISPRa',
        commonMistake:
          'Confusing CRISPRi (reversible transcriptional block via dCas9) with NHEJ knockout (permanent DNA indel mutation).',
      },
    },
    conceptMap: {
      center: 'CRISPR-Cas9',
      nodes: [
        { label: 'sgRNA', role: 'Targeting Guide', detail: '20-nt RNA sequence matching the target DNA site.' },
        { label: 'PAM (5\'-NGG-3\')', role: 'Landing Pad', detail: 'Mandatory short motif required for Cas9 binding.' },
        { label: 'Cas9 Nuclease', role: 'DNA Scissors', detail: 'HNH & RuvC domains cleave both DNA strands.' },
        { label: 'NHEJ Pathway', role: 'Gene Knockout', detail: 'Fast, error-prone repair introducing indels.' },
        { label: 'HDR / Prime', role: 'Precision Edit', detail: 'Template-guided exact sequence rewrite.' },
      ],
    },
    resources: [
      {
        title: 'Genetic Engineering Will Change Everything — CRISPR',
        type: 'Video',
        platform: 'Kurzgesagt',
        duration: '16 min',
        level: 'eli5',
        url: 'https://www.youtube.com/watch?v=jAhjPd4uNFY',
        whyItFits: 'Engaging animated story of how bacteria inspired gene editing.',
      },
      {
        title: 'HHMI BioInteractive: CRISPR-Cas9 Mechanism',
        type: 'Interactive',
        platform: 'HHMI BioInteractive',
        duration: '15 min',
        level: 'highschool',
        url: 'https://www.biointeractive.org/classroom-resources/crispr-cas-9-mechanism-applications',
        whyItFits: 'Click-through 3D molecular visualization of PAM, sgRNA, and repair.',
      },
      {
        title: 'Broad Institute CRISPR Guide & Protocol Overview',
        type: 'Reading Guide',
        platform: 'Broad Institute',
        duration: '25 min',
        level: 'undergrad',
        url: 'https://www.broadinstitute.org/what-broad/areas-focus/project-spotlight/questions-and-answers-about-crispr',
        whyItFits: 'Authoritative breakdown of Cas9, Cas12, Base, and Prime editing.',
      },
      {
        title: 'Addgene CRISPR 101 eBook (Design & Off-Targets)',
        type: 'Practice',
        platform: 'Addgene',
        duration: '40 min',
        level: 'deepdive',
        url: 'https://info.addgene.org/download-addgenes-ebook-crispr-101-2nd-edition',
        whyItFits: 'Lab-grade guide covering sgRNA scoring, dCas9, and AAV delivery.',
      },
    ],
    quiz: [
      {
        level: 'eli5',
        question: 'In CRISPR-Cas9, what is the role of the Guide RNA (sgRNA)?',
        options: [
          'It cuts the DNA strands in half',
          'It acts like a GPS address directing Cas9 to the exact DNA sequence',
          'It provides energy (ATP) to the cell nucleus',
          'It translates proteins inside the ribosome',
        ],
        correctIndex: 1,
        hint: 'Cas9 is the scissors—what tells the scissors WHERE to cut?',
        explanation: 'The guide RNA pairs with complementary DNA bases to pinpoint the exact genomic target for Cas9.',
      },
      {
        level: 'highschool',
        question: 'Which cellular repair pathway is typically exploited to KNOCK OUT (disable) a gene?',
        options: [
          'Homology-Directed Repair (HDR)',
          'Non-Homologous End Joining (NHEJ)',
          'Glycolysis',
          'RNA Splicing',
        ],
        correctIndex: 1,
        hint: 'Which pathway quickly glues broken DNA ends together and often introduces frameshift indels?',
        explanation: 'NHEJ is fast and error-prone, producing small insertions/deletions (indels) that disrupt the gene reading frame.',
      },
    ],
    flashcards: [
      {
        front: 'What is the PAM sequence for standard SpCas9?',
        back: '5\'-NGG-3\' (any nucleotide followed by two guanines), located immediately downstream of the target site.',
        mnemonic: 'No Good Go without NGG!',
      },
      {
        front: 'Why does Prime Editing reduce unintended mutations compared to classic Cas9?',
        back: 'It uses a Cas9 nickase that cuts only ONE DNA strand instead of creating a risky double-strand break.',
        mnemonic: 'Nick one strand, keep DNA intact in hand.',
      },
    ],
  },
  {
    id: 'calculus-derivatives',
    title: 'Calculus: Derivatives & Gradients',
    subject: 'Mathematics',
    difficulty: 'Core Math',
    estimatedMinutes: 10,
    tags: ['Calculus', 'Slope', 'Optimization', 'Rates'],
    levels: {
      eli5: {
        headline: 'The speedometer of any curved line',
        summary:
          'If a graph shows where your car is at every second, the derivative is simply your car\'s speedometer—it tells you how fast and in which direction you are moving at ONE exact instant.',
        steps: [
          {
            title: '1. Average speed vs Instant speed',
            detail: 'Driving 60 km in 1 hour averages 60 km/h—but at a red light your instant speed was 0!',
          },
          {
            title: '2. Zoom way in on a curve',
            detail: 'If you zoom into any smooth curve super close, it looks like a tiny straight ramp.',
          },
          {
            title: '3. Measure that tiny ramp\'s steepness',
            detail: 'Positive derivative = climbing uphill. Zero = flat peak or valley. Negative = rolling downhill.',
          },
        ],
        analogy:
          'Your phone GPS distance log is the original function f(t); your dashboard speedometer needle at this exact second is the derivative f\'(t).',
        formulaOrRule: 'Derivative = Instant Rate of Change = Steepness of Curve Right Now',
        commonMistake:
          'Thinking a derivative of 0 means the function value itself is 0. You can be standing flat at the top of Mount Everest (height = 8,848 m, slope = 0)!',
      },
      highschool: {
        headline: 'The limit of secant slopes as the step size shrinks to zero',
        summary:
          'The derivative f\'(x) measures the exact slope of the tangent line to f(x) at point x. By taking the limit as the horizontal gap h approaches 0, we derive power, product, quotient, and chain rules to optimize real-world quantities.',
        steps: [
          {
            title: '1. Difference Quotient',
            detail: 'Slope between x and x+h is [f(x+h) − f(x)] / h.',
          },
          {
            title: '2. Take the Limit h → 0',
            detail: 'As h shrinks infinitesimally close to zero, the secant line snaps onto the exact tangent line.',
          },
          {
            title: '3. Apply Shortcut Rules',
            detail: 'Power Rule: d/dx(xⁿ) = n·xⁿ⁻¹. Chain Rule: multiply outer derivative by inner derivative.',
          },
          {
            title: '4. Find Maxima & Minima',
            detail: 'Set f\'(x) = 0 to locate critical points, then check f\'\'(x) for concave up (min) or concave down (max).',
          },
        ],
        analogy:
          'Taking two snapshots of a falling ball 0.0001 seconds apart instead of 1 full second apart gives you its true speed at that moment.',
        formulaOrRule: 'f\'(x) = lim(h→0) [f(x + h) − f(x)] / h   |   d/dx (xⁿ) = n xⁿ⁻¹',
        commonMistake:
          'Forgetting the Chain Rule on nested functions: d/dx [sin(3x)] is 3·cos(3x), NOT just cos(3x)!',
      },
      undergrad: {
        headline: 'Best linear approximation, Jacobians, and steepest ascent gradients',
        summary:
          'In multivariable calculus, the derivative generalizes to the Gradient vector ∇f (pointing in the direction of steepest ascent) and the Jacobian matrix J_f, giving the best local linear approximation f(x + Δx) ≈ f(x) + J_f(x)Δx.',
        steps: [
          {
            title: '1. Partial Derivatives',
            detail: 'Differentiate along one coordinate axis while freezing all other variables constant.',
          },
          {
            title: '2. Gradient & Directional Derivative',
            detail: 'The rate of change along unit vector u is D_u f = ∇f · u = ||∇f|| cos(θ), maximized when u aligns with ∇f.',
          },
          {
            title: '3. Hessian & Saddle Points',
            detail: 'The second-derivative Hessian matrix H classifies critical points via eigenvalue signs (positive definite = local min; mixed = saddle).',
          },
        ],
        analogy:
          'Standing on a foggy mountain, the gradient vector ∇f is the compass pointing straight up the steepest slope; −∇f points straight downhill (gradient descent!).',
        formulaOrRule: '∇f = [∂f/∂x₁, ..., ∂f/∂xₙ]ᵀ   |   D_u f = ∇f · u',
        commonMistake:
          'Assuming all partial derivatives existing guarantees differentiability—a function can have partials along axes yet fail to have a tangent plane.',
      },
      deepdive: {
        headline: 'Fréchet differentiability, non-differentiable corners & subgradients',
        summary:
          'A function is differentiable at x only if a linear map A satisfies ||f(x+h)−f(x)−Ah|| / ||h|| → 0. When optimization meets sharp corners (like L1 Lasso |x| or ReLU max(0,x)), convex analysis extends derivatives via subdifferentials ∂f(x).',
        steps: [
          {
            title: '1. Continuity vs Differentiability',
            detail: 'Differentiable implies continuous, never the reverse (e.g., |x| at 0, or the Weierstrass function continuous everywhere yet differentiable nowhere).',
          },
          {
            title: '2. Subgradients for Non-Smooth ML',
            detail: 'At x=0 for |x|, any slope g ∈ [-1, 1] is a valid subgradient supporting the graph from below.',
          },
          {
            title: '3. Lagrange Multipliers',
            detail: 'Constrained extrema occur where ∇f = λ∇g (level curves of objective and constraint are tangent).',
          },
        ],
        analogy:
          'At a sharp V-shaped corner, instead of one unique tangent roof beam, you can balance a whole fan of tilted beams underneath the corner—that fan is the subdifferential.',
        formulaOrRule: 'Lagrange Condition: ∇f(x*) = λ ∇g(x*)   |   Subgradient: f(y) ≥ f(x) + gᵀ(y − x)',
        commonMistake:
          'Forgetting to check boundary endpoints on closed intervals [a, b] when finding global extrema.',
      },
    },
    conceptMap: {
      center: 'Derivatives',
      nodes: [
        { label: 'Limit (h → 0)', role: 'Foundation', detail: 'Shrinks secant interval to an instantaneous point.' },
        { label: 'Chain Rule', role: 'Composition', detail: 'Differentiates nested functions outer × inner.' },
        { label: 'Critical Points', role: 'Optimization', detail: 'Where f\'(x) = 0 or undefined—candidates for max/min.' },
        { label: 'Gradient ∇f', role: 'Multivariable', detail: 'Vector pointing in the direction of steepest increase.' },
        { label: 'Hessian Matrix', role: 'Curvature', detail: 'Second derivatives distinguishing minima from saddles.' },
      ],
    },
    resources: [
      {
        title: 'The Paradox of the Derivative (Essence of Calculus)',
        type: 'Video',
        platform: '3Blue1Brown',
        duration: '18 min',
        level: 'eli5',
        url: 'https://www.youtube.com/watch?v=9vKqVkMQHKk',
        whyItFits: 'Visualizes instantaneous rate of change without scary algebra.',
      },
      {
        title: 'Desmos Interactive Tangent Line Explorer',
        type: 'Interactive',
        platform: 'Desmos',
        duration: '10 min',
        level: 'highschool',
        url: 'https://www.desmos.com/calculator',
        whyItFits: 'Drag a point along any curve and watch the tangent slope update live.',
      },
      {
        title: 'Paul\'s Online Math Notes — Calculus I & III',
        type: 'Reading Guide',
        platform: 'Lamar Univ.',
        duration: '25 min',
        level: 'undergrad',
        url: 'https://tutorial.math.lamar.edu/Classes/CalcI/CalcI.aspx',
        whyItFits: 'Step-by-step worked examples for every derivative rule and gradient.',
      },
      {
        title: 'MIT 18.02 Multivariable Calculus Practice Exams',
        type: 'Practice',
        platform: 'MIT OCW',
        duration: '45 min',
        level: 'deepdive',
        url: 'https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/',
        whyItFits: 'Real exam problems with full worked solutions on gradients and Lagrange multipliers.',
      },
    ],
    quiz: [
      {
        level: 'eli5',
        question: 'If the derivative f\'(x) equals 0 at x = 5, what does the graph look like right at x = 5?',
        options: [
          'The curve must cross the x-axis (y = 0)',
          'The curve is instantaneously flat (horizontal tangent)',
          'The curve shoots straight up vertically',
          'The curve disappears',
        ],
        correctIndex: 1,
        hint: 'Derivative = slope. What does a slope of 0 look like?',
        explanation: 'Zero derivative means zero slope—a flat horizontal tangent, such as a peak, valley, or flat inflection point.',
      },
      {
        level: 'highschool',
        question: 'What is the derivative of f(x) = (2x + 1)³ using the Chain Rule?',
        options: [
          '3(2x + 1)²',
          '6(2x + 1)²',
          '2(2x + 1)²',
          '6x²',
        ],
        correctIndex: 1,
        hint: 'Don\'t forget to multiply by the derivative of the inside (2x + 1)!',
        explanation: 'Outer derivative gives 3(2x+1)² multiplied by inner derivative 2, yielding 6(2x+1)².',
      },
    ],
    flashcards: [
      {
        front: 'What direction does the Gradient vector ∇f point?',
        back: 'In the direction of steepest ASCENT (fastest increase of f). Therefore −∇f points in the direction of steepest DESCENT.',
        mnemonic: 'Gradient climbs UP; minus Gradient skis DOWN.',
      },
      {
        front: 'Is every continuous function differentiable?',
        back: 'No! Sharp corners (like f(x) = |x| at x = 0) are continuous but not differentiable because left and right slopes disagree.',
        mnemonic: 'Smooth = Differentiable; Sharp corner = Not differentiable.',
      },
    ],
  },
  {
    id: 'os-deadlocks',
    title: 'Operating System Deadlocks',
    subject: 'Computer Science',
    difficulty: 'Systems',
    estimatedMinutes: 10,
    tags: ['OS', 'Concurrency', 'Mutex', 'Banker Algorithm'],
    levels: {
      eli5: {
        headline: 'Two kids stubbornly holding half of each other\'s toy',
        summary:
          'A deadlock happens when Program A holds the paintbrush and waits for the paint, while Program B holds the paint and waits for the paintbrush. Neither lets go first, so both freeze forever!',
        steps: [
          {
            title: '1. Exclusive toys',
            detail: 'Only one person can use a printer or file at a time.',
          },
          {
            title: '2. Holding while waiting',
            detail: 'Each program refuses to drop what it already grabbed.',
          },
          {
            title: '3. Waiting in a circle',
            detail: 'A waits for B, and B waits for A—creating an endless standoff.',
          },
          {
            title: '4. Easy fix',
            detail: 'Make everyone always grab tools in the same alphabetical order (Paint first, Paintbrush second)!',
          },
        ],
        analogy:
          'Four cars arriving at a 4-way intersection simultaneously, each waiting for the car on its right to move first—gridlock!',
        formulaOrRule: 'Deadlock = Circular Waiting where Nobody Lets Go',
        commonMistake:
          'Confusing deadlock (zero progress, permanently stuck) with starvation (slow progress because others keep cutting in line).',
      },
      highschool: {
        headline: 'The 4 Coffman Conditions that cause permanent thread freeze',
        summary:
          'In multithreaded programs, a deadlock occurs ONLY when all four Coffman conditions hold simultaneously: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Breaking just ONE condition completely prevents deadlock.',
        steps: [
          {
            title: '1. Mutual Exclusion',
            detail: 'At least one resource cannot be shared concurrently (e.g., a mutex lock).',
          },
          {
            title: '2. Hold and Wait',
            detail: 'A thread holds ≥1 resource while waiting to acquire another.',
          },
          {
            title: '3. No Preemption',
            detail: 'The OS cannot forcibly snatch a held resource away from a thread.',
          },
          {
            title: '4. Circular Wait',
            detail: 'A closed cycle exists: P1 waits on P2, P2 waits on P3, ..., Pn waits on P1.',
          },
        ],
        analogy:
          'Like the Dining Philosophers problem: 5 people sit around a table with 5 forks. If everyone picks up their left fork at once, nobody can ever pick up a right fork to eat.',
        formulaOrRule: 'Break ANY 1 of 4 Coffman Conditions → Deadlock Impossible',
        commonMistake:
          'Assuming a cycle in a Resource Allocation Graph ALWAYS means deadlock—if resources have MULTIPLE instances, a cycle is necessary but NOT sufficient!',
      },
      undergrad: {
        headline: 'Resource Allocation Graphs, Safe States & Banker\'s Algorithm',
        summary:
          'Operating systems handle deadlocks via Prevention (structural lock ordering), Avoidance (Banker\'s Algorithm checking safe execution sequences), Detection & Recovery (wait-for graph cycle detection + process rollback), or the Ostrich Algorithm (ignore rare deadlocks, used by Linux/Windows).',
        steps: [
          {
            title: '1. Lock Ordering (Prevention)',
            detail: 'Impose a strict global total order on lock IDs: threads may only acquire Lock j if j > max held lock ID, eliminating circular wait.',
          },
          {
            title: '2. Banker\'s Algorithm (Avoidance)',
            detail: 'Before granting a request, simulate allocation and verify whether at least one Safe Sequence exists where all processes finish using Available + Released resources.',
          },
          {
            title: '3. Single vs Multi-Instance RAG',
            detail: 'Single-instance resources: cycle ↔ deadlock. Multi-instance: cycle is necessary, run safety/reduction check to confirm.',
          },
        ],
        analogy:
          'Banker\'s Algorithm acts like a cautious loan officer who refuses to lend cash if it could leave the bank unable to satisfy at least one customer\'s full credit line.',
        formulaOrRule: 'Need[i] = Max[i] − Allocation[i]   |   Safe if ∃ sequence where Need[i] ≤ Work',
        commonMistake:
          'Thinking an Unsafe State equals Deadlock. An unsafe state merely means deadlock COULD happen depending on future requests—it is not deadlocked yet!',
      },
      deepdive: {
        headline: 'Livelock, Priority Inversion, and Lock-Free CAS Concurrency',
        summary:
          'Real production systems face subtler concurrency traps: Livelock (threads continually retry and yield without progressing), Priority Inversion (Mars Pathfinder bug fixed via Priority Inheritance), and scalable lock-free data structures using atomic Compare-And-Swap (CAS).',
        steps: [
          {
            title: '1. Deadlock vs Livelock vs Starvation',
            detail: 'Deadlock = threads blocked (0% CPU). Livelock = threads active (100% CPU) politely stepping aside into each other like two people in a hallway.',
          },
          {
            title: '2. Priority Inversion',
            detail: 'High-priority thread waits on a mutex held by a low-priority thread preempted by medium-priority threads. Solved by Priority Inheritance Protocol.',
          },
          {
            title: '3. Lock-Free Alternatives',
            detail: 'Atomic CAS loops guarantee system-wide progress with zero deadlocks (watch for the ABA problem).',
          },
        ],
        analogy:
          'Deadlock is two people freezing in a narrow hallway; Livelock is both repeatedly stepping left-right-left-right in sync so neither ever passes.',
        formulaOrRule: 'Safe State ⊂ No Deadlock  |  Deadlock ⊂ Unsafe State',
        commonMistake:
          'Forgetting the Ostrich Algorithm in OS exams—modern general-purpose OSes rarely run Banker\'s Algorithm because processes don\'t declare max resource needs upfront.',
      },
    },
    conceptMap: {
      center: 'OS Deadlocks',
      nodes: [
        { label: '4 Coffman Conditions', role: 'Root Cause', detail: 'Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait.' },
        { label: 'Lock Ordering', role: 'Prevention', detail: 'Acquire locks in global ascending ID order.' },
        { label: 'Banker\'s Algorithm', role: 'Avoidance', detail: 'Checks for a Safe Sequence before granting resources.' },
        { label: 'Wait-For Graph', role: 'Detection', detail: 'Finds cycles among waiting processes.' },
        { label: 'Livelock', role: 'Cousin Bug', detail: 'Threads actively retry without making progress.' },
      ],
    },
    resources: [
      {
        title: 'Deadlocks & Dining Philosophers Visualized',
        type: 'Video',
        platform: 'Computerphile',
        duration: '11 min',
        level: 'eli5',
        url: 'https://www.youtube.com/watch?v=FYUi-u7UWgw',
        whyItFits: 'Crystal-clear everyday intuition of threads deadlocking over locks.',
      },
      {
        title: 'Operating Systems: Three Easy Pieces — Concurrency Bugs',
        type: 'Reading Guide',
        platform: 'OSTEP (Free Book)',
        duration: '25 min',
        level: 'undergrad',
        url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/threads-bugs.pdf',
        whyItFits: 'Best undergraduate OS chapter on Coffman conditions and lock ordering.',
      },
      {
        title: 'Banker\'s Algorithm Interactive Step-by-Step Simulator',
        type: 'Interactive',
        platform: 'GeeksforGeeks',
        duration: '20 min',
        level: 'highschool',
        url: 'https://www.geeksforgeeks.org/bankers-algorithm-in-operating-system-2/',
        whyItFits: 'Worked Need/Allocation/Available tables ready for exam prep.',
      },
    ],
    quiz: [
      {
        level: 'highschool',
        question: 'If all threads strictly acquire locks in ascending numerical order (Lock 1 before Lock 2), which Coffman condition is broken?',
        options: [
          'Mutual Exclusion',
          'Circular Wait',
          'No Preemption',
          'Starvation',
        ],
        correctIndex: 1,
        hint: 'Can a thread holding Lock 5 ever wait on Lock 2 under this rule?',
        explanation: 'Global lock ordering makes a waiting cycle mathematically impossible, breaking Circular Wait.',
      },
      {
        level: 'undergrad',
        question: 'If a system enters an UNSAFE state in Banker\'s Algorithm, does that mean it is currently deadlocked?',
        options: [
          'Yes, unsafe state and deadlock are identical',
          'No—it means deadlock is possible if processes request their remaining max resources',
          'No—unsafe states can never lead to deadlock',
          'Only when there is 1 CPU core',
        ],
        correctIndex: 1,
        hint: 'Think of driving without a seatbelt: dangerous, or already crashed?',
        explanation: 'All deadlocked states are unsafe, but an unsafe state only means the OS can no longer guarantee avoiding deadlock.',
      },
    ],
    flashcards: [
      {
        front: 'What are the 4 Coffman Conditions for Deadlock?',
        back: '1. Mutual Exclusion  2. Hold and Wait  3. No Preemption  4. Circular Wait.',
        mnemonic: 'My Horse Never Circles (M-H-N-C).',
      },
      {
        front: 'Deadlock vs Livelock?',
        back: 'In Deadlock, threads are blocked sleeping forever. In Livelock, threads stay active changing states repeatedly without making useful progress.',
        mnemonic: 'Dead = Frozen; Live = Running in place.',
      },
    ],
  },
  {
    id: 'thermodynamics-entropy',
    title: 'Thermodynamics & Entropy',
    subject: 'Physics',
    difficulty: 'Core Physics',
    estimatedMinutes: 11,
    tags: ['Entropy', '2nd Law', 'Heat', 'Energy'],
    levels: {
      eli5: {
        headline: 'Why your bedroom gets messy on its own, and hot tea always cools down',
        summary:
          'Energy never disappears—it only changes outfits (1st Law). Entropy measures how spread out energy is: there are millions of ways for toys to be scattered across your floor, and only ONE way for them to be neatly stacked, so nature naturally drifts toward spread-out states (2nd Law).',
        steps: [
          {
            title: '1. Energy is conserved (1st Law)',
            detail: 'You cannot create energy from thin air—heat going into a mug equals the energy warming it up.',
          },
          {
            title: '2. Energy loves to spread out (2nd Law)',
            detail: 'Heat naturally flows from hot coffee into cooler room air—never the other way around by itself.',
          },
          {
            title: '3. Why? Pure probability!',
            detail: 'There are vastly more "mixed/spread-out" arrangements of molecules than "clumped-together" ones.',
          },
        ],
        analogy:
          'Drop a drop of blue food coloring into clear water. Random jiggling spreads it evenly blue. Waiting for all blue molecules to randomly clump back into one tiny corner would take longer than the age of the universe!',
        formulaOrRule: 'Total Entropy of an Isolated System Never Decreases (ΔS_universe ≥ 0)',
        commonMistake:
          'Thinking life or refrigerators violate the 2nd Law. Your fridge lowers entropy INSIDE by dumping EVEN MORE heat/entropy out the warm coils on the back!',
      },
      highschool: {
        headline: 'Energy conservation, microstates, and why no engine is 100% efficient',
        summary:
          'Thermodynamics connects macroscopic heat and work to microscopic molecular motion. The 1st Law tracks energy balance (ΔU = Q − W), while the 2nd Law defines entropy S as the arrow of time, capping maximum heat-engine efficiency at the Carnot limit.',
        steps: [
          {
            title: '1. First Law: ΔU = Q − W',
            detail: 'Internal energy rises when heat Q enters the gas and drops when the gas does expansion work W.',
          },
          {
            title: '2. Reversible Entropy Change',
            detail: 'ΔS = Q_rev / T. Adding heat to a cold object increases entropy more than adding the same heat to a hot object.',
          },
          {
            title: '3. Carnot Efficiency Ceiling',
            detail: 'Even an ideal frictionless engine cannot convert 100% of heat into work: η_max = 1 − (T_cold / T_hot) in Kelvin.',
          },
        ],
        analogy:
          'Whispering in a quiet library (cold T) causes huge disruption (large ΔS), whereas whispering at a loud rock concert (hot T) barely changes anything (small ΔS).',
        formulaOrRule: 'ΔU = Q − W   |   η_Carnot = 1 − (T_c / T_h)  [Kelvin!]',
        commonMistake:
          'Plugging Celsius instead of Kelvin into Carnot efficiency η = 1 − T_c/T_h—always convert °C + 273.15 first!',
      },
      undergrad: {
        headline: 'Boltzmann statistical entropy, Gibbs free energy & thermodynamic potentials',
        summary:
          'Statistical mechanics grounds entropy microscopically via Boltzmann\'s formula S = k_B ln(Ω), where Ω is the multiplicity of accessible microstates. At constant temperature and pressure, spontaneity is governed by minimizing Gibbs Free Energy ΔG = ΔH − TΔS < 0.',
        steps: [
          {
            title: '1. Boltzmann\'s Bridge',
            detail: 'S = k_B ln Ω turns multiplicative independent probabilities (Ω_total = Ω₁Ω₂) into additive entropy (S_total = S₁ + S₂).',
          },
          {
            title: '2. Fundamental Identity',
            detail: 'dU = T dS − P dV + μ dN unites the 1st and 2nd laws for quasi-static processes.',
          },
          {
            title: '3. Gibbs Free Energy Spontaneity',
            detail: 'Endothermic reactions (ΔH > 0) still proceed spontaneously when TΔS > ΔH (e.g., ice melting above 0°C).',
          },
        ],
        analogy:
          'Gibbs Free Energy ΔG = ΔH − TΔS is a tug-of-war between lowering energy (ΔH) and maximizing molecular freedom (TΔS), with temperature T acting as the referee.',
        formulaOrRule: 'S = k_B ln(Ω)   |   ΔG = ΔH − TΔS < 0 (Spontaneous)',
        commonMistake:
          'Equating entropy strictly with visual "messiness"—entropy is strictly about the number of accessible microscopic energy/position microstates Ω.',
      },
      deepdive: {
        headline: 'Maxwell\'s Demon, Landauer\'s Principle & Information-Thermodynamics link',
        summary:
          'Entropy bridges physics and computer science: Shannon information entropy H = −∑ p_i log p_i shares the exact mathematical form of Gibbs entropy. Maxwell\'s Demon is resolved by Landauer\'s Principle: erasing 1 bit of memory inevitably dissipates at least k_B T ln(2) of heat.',
        steps: [
          {
            title: '1. Resolving Maxwell\'s Demon',
            detail: 'Sorting fast and slow molecules requires recording information in finite memory; resetting that memory dumps entropy back into the environment.',
          },
          {
            title: '2. Landauer\'s Limit',
            detail: 'Fundamental thermodynamic lower bound on irreversible computation: E_erase ≥ k_B T ln(2) ≈ 2.85 × 10⁻²¹ J at 300 K.',
          },
          {
            title: '3. Fluctuation Theorems',
            detail: 'At nanoscale systems, brief microscopic entropy decreases can occur with exponentially suppressed probability (Jarzynski equality).',
          },
        ],
        analogy:
          'Erasing a whiteboard in physics isn\'t free: clearing 1 bit of knowledge always pays a tiny mandatory heat tax to the universe.',
        formulaOrRule: 'Landauer Bound: ΔQ_erase ≥ k_B T ln(2) per bit erased',
        commonMistake:
          'Thinking the 2nd Law forbids local entropy decrease—it only constrains ΔS_system + ΔS_surroundings ≥ 0.',
      },
    },
    conceptMap: {
      center: 'Entropy & Thermo',
      nodes: [
        { label: '1st Law (ΔU = Q−W)', role: 'Conservation', detail: 'Total energy is conserved across heat and work.' },
        { label: '2nd Law (ΔS ≥ 0)', role: 'Arrow of Time', detail: 'Energy spontaneously disperses across microstates.' },
        { label: 'Boltzmann S=k ln Ω', role: 'Microscopic', detail: 'Counts accessible molecular arrangements.' },
        { label: 'Carnot Limit', role: 'Efficiency Cap', detail: 'Max engine efficiency 1 − T_c/T_h in Kelvin.' },
        { label: 'Gibbs ΔG', role: 'Spontaneity', detail: 'Balances enthalpy ΔH against entropy TΔS.' },
      ],
    },
    resources: [
      {
        title: 'The Most Misunderstood Concept in Physics (Entropy)',
        type: 'Video',
        platform: 'Veritasium',
        duration: '27 min',
        level: 'eli5',
        url: 'https://www.youtube.com/watch?v=DxL2HoqllBY',
        whyItFits: 'Replaces the vague "disorder" myth with clear energy-spreading visuals.',
      },
      {
        title: 'PhET Gas Properties & Heat Simulator',
        type: 'Interactive',
        platform: 'PhET Colorado',
        duration: '15 min',
        level: 'highschool',
        url: 'https://phet.colorado.edu/en/simulations/gas-properties',
        whyItFits: 'Pump molecules, heat containers, and watch PV = nRT and diffusion live.',
      },
      {
        title: 'MIT 5.60 Thermodynamics & Kinetics Lecture Notes',
        type: 'Reading Guide',
        platform: 'MIT OCW',
        duration: '30 min',
        level: 'undergrad',
        url: 'https://ocw.mit.edu/courses/5-60-thermodynamics-kinetics-spring-2008/',
        whyItFits: 'Rigorous derivations of Carnot cycles, entropy, and Gibbs free energy.',
      },
    ],
    quiz: [
      {
        level: 'highschool',
        question: 'A Carnot engine operates between T_hot = 600 K and T_cold = 300 K. What is its maximum possible efficiency?',
        options: ['25%', '50%', '75%', '100%'],
        correctIndex: 1,
        hint: 'Use η = 1 − (T_cold / T_hot).',
        explanation: 'η = 1 − (300 / 600) = 1 − 0.5 = 50%.',
      },
      {
        level: 'eli5',
        question: 'Why does a household refrigerator NOT break the Second Law of Thermodynamics?',
        options: [
          'Cold air has higher entropy than warm air',
          'It releases more entropy/heat into the kitchen room than it removes from inside the fridge',
          'Electricity does not count as energy',
          'The 2nd Law only applies in outer space',
        ],
        correctIndex: 1,
        hint: 'Feel the back coils of your refrigerator—are they hot or cold?',
        explanation: 'Using electrical work, the fridge decreases entropy inside while increasing surrounding room entropy by an even larger amount.',
      },
    ],
    flashcards: [
      {
        front: 'What unit MUST temperature be in for Carnot efficiency η = 1 − T_c/T_h?',
        back: 'Kelvin (absolute temperature)! Never Celsius or Fahrenheit.',
        mnemonic: 'Carnot loves Kelvin—always add 273.15!',
      },
      {
        front: 'When is a chemical process spontaneous at constant T and P?',
        back: 'When Gibbs Free Energy ΔG = ΔH − TΔS is negative (ΔG < 0).',
        mnemonic: 'Negative ΔG means GO!',
      },
    ],
  },
  {
    id: 'supply-demand-elasticity',
    title: 'Supply, Demand & Elasticity',
    subject: 'Economics',
    difficulty: 'Microeconomics',
    estimatedMinutes: 9,
    tags: ['Markets', 'Pricing', 'Elasticity', 'Equilibrium'],
    levels: {
      eli5: {
        headline: 'Why concert tickets skyrocket while life-saving medicine buyers still pay',
        summary:
          'When lots of people want something rare, prices climb (Demand). Elasticity simply asks: "If the shop raises the price by 10%, how dramatically do customers walk away?" If they easily switch to another snack, it\'s elastic; if they MUST buy it anyway (like insulin), it\'s inelastic!',
        steps: [
          {
            title: '1. Demand vs Supply',
            detail: 'Higher prices make buyers want less, but encourage sellers to make more. Where both agree is Equilibrium.',
          },
          {
            title: '2. Elastic = Stretchy Reaction',
            detail: 'Like a rubber band: a small price hike causes a HUGE drop in sales (e.g., one brand of soda when 10 other brands sit next to it).',
          },
          {
            title: '3. Inelastic = Stubborn Reaction',
            detail: 'Even a big price jump barely lowers quantity bought (e.g., electricity, salt, or emergency medicine).',
          },
        ],
        analogy:
          'Elastic demand is a stretchy rubber band (small pull = huge stretch). Inelastic demand is a steel chain (pull hard = barely budges).',
        formulaOrRule: 'Elasticity = (% Change in Quantity Bought) ÷ (% Change in Price)',
        commonMistake:
          'Thinking raising prices ALWAYS increases revenue. For elastic goods, raising prices loses so many buyers that total revenue actually drops!',
      },
      highschool: {
        headline: 'Price Elasticity of Demand (PED), Total Revenue & Tax Incidence',
        summary:
          'PED = |%ΔQ / %ΔP|. If PED > 1 (elastic), price and total revenue move in opposite directions. If PED < 1 (inelastic), raising price boosts total revenue. Elasticity also decides who actually bears the burden of a government sales tax.',
        steps: [
          {
            title: '1. Four Determinants (TINS)',
            detail: 'Time horizon, Income share, Necessity vs luxury, and Substitutes available.',
          },
          {
            title: '2. Total Revenue Test',
            detail: 'TR = P × Q. Elastic (|E| > 1): cut price to grow revenue. Inelastic (|E| < 1): raise price to grow revenue.',
          },
          {
            title: '3. Who Pays Taxes?',
            detail: 'Whichever side (buyers or sellers) is MORE inelastic gets stuck paying the larger share of a per-unit tax.',
          },
        ],
        analogy:
          'A movie theater charges huge prices for popcorn inside (inelastic—no substitutes inside the theater!) but discounts matinee tickets (elastic—lots of alternatives).',
        formulaOrRule: 'PED = (%ΔQ / %ΔP)   |   |PED| > 1 Elastic,  |PED| < 1 Inelastic,  |PED| = 1 Unit Elastic',
        commonMistake:
          'Equating slope with elasticity! Along a straight linear demand curve, the slope is constant, yet elasticity changes from ∞ at the top to 0 at the bottom.',
      },
      undergrad: {
        headline: 'Point elasticity, Lerner Index & Deadweight Loss triangles',
        summary:
          'Point elasticity ε = (dQ/dP)·(P/Q) varies along linear demand curves and determines optimal monopoly markup via the Lerner Index (P − MC)/P = −1/ε. Tax deadweight loss scales positively with both supply and demand elasticities.',
        steps: [
          {
            title: '1. Revenue Maximization at |ε| = 1',
            detail: 'Since MR = P(1 + 1/ε), marginal revenue hits zero precisely at unit elasticity (midpoint of a linear demand curve).',
          },
          {
            title: '2. Monopoly Pricing Rule',
            detail: 'A profit-maximizing monopolist NEVER operates on the inelastic portion (|ε| < 1), because raising price lowers Q (cutting cost) AND raises revenue!',
          },
          {
            title: '3. Tax Incidence Formula',
            detail: 'Buyer share of tax = ε_S / (ε_S + |ε_D|). Less elastic side bears higher incidence.',
          },
        ],
        analogy:
          'Elasticity acts like a shock absorber: the stiffer (more inelastic) side absorbs the impact of a tax.',
        formulaOrRule: 'Lerner Index: (P − MC)/P = −1/ε_D   |   MR = P(1 + 1/ε_D)',
        commonMistake:
          'Calculating midpoint percentage change using only the starting value instead of the arc/midpoint average, giving different elasticities going up vs down.',
      },
      deepdive: {
        headline: 'Slutsky decomposition, Cross-Price & Ramsey Optimal Taxation',
        summary:
          'Advanced microeconomics decomposes demand responses into Substitution and Income effects via the Slutsky equation, separates Marshallian from Hicksian (compensated) elasticities, and derives the inverse-elasticity Ramsey Rule for minimizing tax deadweight loss.',
        steps: [
          {
            title: '1. Slutsky Equation',
            detail: '∂x/∂p = ∂h/∂p − x(∂x/∂I). Explains rare Giffen goods where an extreme negative income effect overrides substitution.',
          },
          {
            title: '2. Ramsey Optimal Tax Rule',
            detail: 'To raise revenue with minimum deadweight loss, tax rates should be inversely proportional to demand elasticity (efficiency vs equity trade-off!).',
          },
          {
            title: '3. Cross-Price & Income Elasticity',
            detail: 'ε_xy > 0 → Substitutes; ε_xy < 0 → Complements; ε_I < 0 → Inferior goods.',
          },
        ],
        analogy:
          'Ramsey taxation reveals economics\' classic tension: taxing necessities creates minimal market distortion, yet hits lower-income households hardest.',
        formulaOrRule: 'Ramsey Rule: t_i / P_i ∝ 1 / |ε_i|   |   Slutsky: ∂x/∂p = ∂h/∂p − x(∂x/∂I)',
        commonMistake:
          'Forgetting that a profit-maximizing firm maximizes (TR − TC), NOT TR—so it prices where MR = MC (strictly in the elastic region where |ε| > 1).',
      },
    },
    conceptMap: {
      center: 'Elasticity',
      nodes: [
        { label: 'Substitutes', role: 'Key Driver', detail: 'More substitutes = higher price elasticity.' },
        { label: 'Total Revenue', role: 'Pricing Rule', detail: 'Peaks at unit elasticity (|ε| = 1).' },
        { label: 'Tax Incidence', role: 'Policy Impact', detail: 'More inelastic side bears larger tax burden.' },
        { label: 'Deadweight Loss', role: 'Efficiency', detail: 'Lost mutually beneficial trades from taxes/ceilings.' },
        { label: 'Lerner Markup', role: 'Market Power', detail: 'Inelastic demand allows higher monopoly markup.' },
      ],
    },
    resources: [
      {
        title: 'Elasticity of Demand — Fast Visual Crash Course',
        type: 'Video',
        platform: 'Jacob Clifford (ACDC Econ)',
        duration: '8 min',
        level: 'eli5',
        url: 'https://www.youtube.com/watch?v=HHcblIxiAAk',
        whyItFits: 'Energetic, memorable everyday examples and Total Revenue test.',
      },
      {
        title: 'Khan Academy — Price Elasticity Practice',
        type: 'Practice',
        platform: 'Khan Academy',
        duration: '20 min',
        level: 'highschool',
        url: 'https://www.khanacademy.org/economics-finance-domain/microeconomics/elasticity-tutorial',
        whyItFits: 'Interactive midpoint formula drills with instant hints.',
      },
      {
        title: 'MIT 14.01 Principles of Microeconomics',
        type: 'Reading Guide',
        platform: 'MIT OCW',
        duration: '30 min',
        level: 'undergrad',
        url: 'https://ocw.mit.edu/courses/14-01-principles-of-microeconomics-fall-2018/',
        whyItFits: 'Formal Slutsky decomposition, Lerner Index, and tax welfare analysis.',
      },
    ],
    quiz: [
      {
        level: 'highschool',
        question: 'If coffee demand is INELASTIC (|PED| = 0.4) and a cafe raises prices by 10%, what happens to Total Revenue?',
        options: [
          'Total revenue decreases sharply',
          'Total revenue increases',
          'Total revenue stays exactly unchanged',
          'Quantity demanded increases by 4%',
        ],
        correctIndex: 1,
        hint: 'Quantity only drops by 4% while price rises by 10%!',
        explanation: 'Because the 10% price gain outweighs the 4% drop in cups sold, total revenue rises.',
      },
      {
        level: 'undergrad',
        question: 'Along a straight downward-sloping linear demand curve, where is Total Revenue maximized?',
        options: [
          'At the highest possible price',
          'At the exact midpoint where |ε| = 1',
          'Where price equals zero',
          'Everywhere along the curve because slope is constant',
        ],
        correctIndex: 1,
        hint: 'Check MR = P(1 + 1/ε). When does MR = 0?',
        explanation: 'Marginal revenue crosses 0 precisely at unit elasticity (|ε| = 1), the midpoint of a linear demand curve.',
      },
    ],
    flashcards: [
      {
        front: 'What does TINS stand for in Elasticity determinants?',
        back: 'Time horizon, Income proportion, Necessity vs Luxury, Substitutes availability.',
        mnemonic: 'More TINS = More Elastic!',
      },
      {
        front: 'Who pays more of a sales tax: the elastic side or the inelastic side?',
        back: 'The MORE INELASTIC side (the one with fewer alternatives/escape routes).',
        mnemonic: 'Inelastic = Stuck paying the bill.',
      },
    ],
  },
  {
    id: 'mitochondria',
    title: 'Mitochondria (Cell Powerhouse)',
    subject: 'Biology',
    difficulty: 'Cell Biology',
    estimatedMinutes: 9,
    tags: ['Cell', 'ATP', 'Plant Cell', 'Animal Cell', 'Organelle', 'Cellular Respiration'],
    levels: {
      eli5: {
        headline: 'The tiny rechargeable battery factories inside both plant and animal cells',
        summary:
          'Mitochondria are bean-shaped organelles found inside almost all eukaryotic cells—including BOTH plant cells and animal cells. They take sugar (glucose) and oxygen and turn them into tiny energy packets called ATP that power everything the cell does!',
        steps: [
          {
            title: '1. Present in BOTH Plant & Animal Cells',
            detail: 'Plants use chloroplasts to make sugar from sunlight, AND they still need mitochondria to burn that sugar into usable ATP energy (especially at night!).',
          },
          {
            title: '2. Fuel goes in (Glucose + Oxygen)',
            detail: 'Broken-down food molecules enter the mitochondrion along with oxygen you breathe in.',
          },
          {
            title: '3. Folded inner walls boost power',
            detail: 'Inside are wavy folds called cristae that pack huge energy-making surface area into a tiny space.',
          },
          {
            title: '4. ATP energy comes out',
            detail: 'The cell spends ATP like cash to grow, move, repair itself, and pump nutrients.',
          },
        ],
        analogy:
          'Think of a plant cell like a solar-powered house: chloroplasts are the rooftop solar panels making fuel, while mitochondria are the power generators turning that fuel into electricity for every room!',
        formulaOrRule: 'Glucose + Oxygen → Carbon Dioxide + Water + ATP Energy (Cellular Respiration)',
        commonMistake:
          'Thinking plant cells ONLY have chloroplasts and no mitochondria! Plant cells contain BOTH chloroplasts and mitochondria.',
      },
      highschool: {
        headline: 'Double-membrane organelles driving aerobic cellular respiration & ATP synthesis',
        summary:
          'Mitochondria are double-membraned organelles present in eukaryotic cells (plants, animals, fungi, and protists). Their inner membrane folds into cristae surrounding the mitochondrial matrix, where the Krebs (Citric Acid) Cycle and Oxidative Phosphorylation generate ~30–32 ATP molecules per glucose.',
        steps: [
          {
            title: '1. Double-Membrane Architecture',
            detail: 'A smooth outer membrane protects the organelle; a deeply folded inner membrane (cristae) houses the Electron Transport Chain and ATP synthase.',
          },
          {
            title: '2. Krebs Cycle in the Matrix',
            detail: 'Pyruvate (from glycolysis in the cytoplasm) is oxidized inside the matrix, releasing CO₂ and loading electron carriers NADH and FADH₂.',
          },
          {
            title: '3. Electron Transport Chain & Chemiosmosis',
            detail: 'Electrons pump H⁺ protons into the intermembrane space, creating a gradient that spins ATP synthase like a hydroelectric turbine.',
          },
          {
            title: '4. Semi-Autonomous Organelle',
            detail: 'Mitochondria carry their own circular DNA (mtDNA) and 70S ribosomes, allowing them to replicate independently by binary fission.',
          },
        ],
        analogy:
          'The proton gradient across the inner membrane works just like water held behind a dam—flowing back through ATP synthase spins the turbine to generate ATP.',
        formulaOrRule: 'C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O + ~30–32 ATP',
        commonMistake:
          'Confusing glycolysis location: Glycolysis happens in the CYTOPLASM outside the mitochondrion, whereas the Krebs Cycle and ETC happen inside the mitochondrion.',
      },
      undergrad: {
        headline: 'Chemiosmotic coupling, proton-motive force & endosymbiotic origin',
        summary:
          'Mitochondria couple redox free energy from NADH/FADH₂ oxidation (Complexes I–IV) to an electrochemical proton-motive force (Δp = Δψ − 2.3RT/F · ΔpH) across the impermeable inner membrane. Beyond bioenergetics, mitochondria regulate Ca²⁺ buffering, reactive oxygen species (ROS), and intrinsic apoptosis via cytochrome c release.',
        steps: [
          {
            title: '1. Respiratory Chain Complexes I–IV',
            detail: 'Complexes I, III, and IV pump protons from matrix to intermembrane space while O₂ acts as the terminal electron acceptor forming H₂O.',
          },
          {
            title: '2. F₀F₁-ATP Synthase Rotary Catalysis',
            detail: 'Proton flux through the F₀ c-ring rotates the γ-shaft inside F₁, driving conformational transitions (Open → Loose → Tight) to phosphorylate ADP.',
          },
          {
            title: '3. Endosymbiotic Theory',
            detail: 'Circular mtDNA, double membranes, cardiolipin enrichment, and bacterial-like 70S ribosomes evidence ancient α-proteobacterial endosymbiosis.',
          },
          {
            title: '4. Role in Plant vs Animal Cells',
            detail: 'In plants, mitochondria coordinate tightly with chloroplasts during photorespiration (glycine → serine conversion) and dark-phase ATP supply.',
          },
        ],
        analogy:
          'Mitochondria act like an integrated circuit combining a power plant (ATP), a voltage capacitor (Δψ), and a self-destruct switch (cytochrome c triggering apoptosis).',
        formulaOrRule: 'Δp = Δψ − (2.303 RT / F) ΔpH   |   P/O Ratio ≈ 2.5 ATP/NADH, 1.5 ATP/FADH₂',
        commonMistake:
          'Assuming uncouplers (like DNP or UCP1 thermogenin) stop the electron transport chain—actually, they dissipate the proton gradient as heat while oxygen consumption SPEEDS UP.',
      },
      deepdive: {
        headline: 'Maternal inheritance, mitochondrial dynamics (fusion/fission) & bioenergetic traps',
        summary:
          'Exam mastery of mitochondria integrates maternal non-Mendelian inheritance of mtDNA, heteroplasmy thresholds in mitochondrial myopathies, cardiolipin-stabilized supercomplexes (respirasomes), and plant-specific Alternative Oxidase (AOX) pathways that prevent ROS overload under stress.',
        steps: [
          {
            title: '1. Maternal Inheritance & Heteroplasmy',
            detail: 'Because zygote mitochondria derive almost exclusively from the oocyte, mtDNA mutations transmit maternally and manifest clinically only above a tissue-specific mutation threshold.',
          },
          {
            title: '2. Plant Alternative Oxidase (AOX)',
            detail: 'Plant mitochondria uniquely express AOX, bypassing Complexes III and IV to reduce O₂ directly without proton pumping—limiting ROS and generating heat in thermogenic flowers.',
          },
          {
            title: '3. Intrinsic Apoptosis Checkpoint',
            detail: 'BAX/BAK pore formation permeabilizes the outer mitochondrial membrane (MOMP), releasing cytochrome c to assemble the Apaf-1 apoptosome and activate Caspase-9.',
          },
        ],
        analogy:
          'Plant Alternative Oxidase is like a pressure-relief valve on a steam engine: it vents excess electron pressure safely as heat so sparks (ROS) do not damage the plant cell.',
        formulaOrRule: 'MOMP → Cytochrome c release → Apaf-1 Apoptosome → Caspase-9 → Apoptosis',
        commonMistake:
          'Forgetting that MOST (~99%) mitochondrial proteins are actually encoded by NUCLEAR DNA and imported via TOM/TIM translocases—mtDNA encodes only a small core subset (13 polypeptides in humans).',
      },
    },
    conceptMap: {
      center: 'Mitochondria',
      nodes: [
        { label: 'Plant & Animal Cells', role: 'Where Found', detail: 'Present in almost all eukaryotic cells—both plants and animals!' },
        { label: 'Cristae Folds', role: 'Inner Membrane', detail: 'Deep folds maximizing surface area for ATP synthesis.' },
        { label: 'Krebs Cycle', role: 'Matrix Engine', detail: 'Oxidizes pyruvate to generate NADH, FADH₂, and CO₂.' },
        { label: 'ATP Synthase', role: 'Molecular Turbine', detail: 'Uses proton gradient to synthesize cellular ATP fuel.' },
        { label: 'Circular mtDNA', role: 'Own Genome', detail: 'Evidence of ancient bacterial endosymbiosis.' },
      ],
    },
    resources: [
      {
        title: 'Mitochondria: Powerhouse of the Cell Explained Visually',
        type: 'Video',
        platform: 'Amoeba Sisters / YouTube',
        duration: '8 min',
        level: 'eli5',
        url: 'https://www.youtube.com/results?search_query=mitochondria+explained+simply+plant+and+animal+cell',
        whyItFits: 'Super clear animated walkthrough of mitochondria in both plant and animal cells.',
      },
      {
        title: 'Khan Academy — Mitochondria & Chloroplasts',
        type: 'Reading Guide',
        platform: 'Khan Academy',
        duration: '15 min',
        level: 'highschool',
        url: 'https://www.khanacademy.org/science/biology/structure-of-a-cell/tour-of-organelles/a/chloroplasts-and-mitochondria',
        whyItFits: 'Side-by-side comparison of structure, ATP production, and plant vs animal cells.',
      },
      {
        title: 'Cellular Respiration & Oxidative Phosphorylation',
        type: 'Interactive',
        platform: 'Khan Academy AP Bio',
        duration: '25 min',
        level: 'undergrad',
        url: 'https://www.khanacademy.org/science/ap-biology/cellular-energetics/cellular-respiration-ap/a/oxidative-phosphorylation-etc',
        whyItFits: 'Deep breakdown of the Electron Transport Chain, proton gradient, and ATP yield.',
      },
      {
        title: 'Mitochondrion — Comprehensive Reference & Plant AOX',
        type: 'Reading Guide',
        platform: 'Wikipedia Biology',
        duration: '30 min',
        level: 'deepdive',
        url: 'https://en.wikipedia.org/wiki/Mitochondrion',
        whyItFits: 'Full reference covering cristae, mtDNA, endosymbiosis, and plant cell roles.',
      },
    ],
    quiz: [
      {
        level: 'eli5',
        question: 'Are mitochondria present in plant cells, animal cells, or both?',
        options: [
          'Only in animal cells (plants only have chloroplasts)',
          'Only in plant cells',
          'In BOTH plant cells and animal cells',
          'Only in bacteria',
        ],
        correctIndex: 2,
        hint: 'How does a plant cell get usable ATP energy at night when there is no sunlight?',
        explanation: 'Both plant and animal eukaryotic cells have mitochondria! Chloroplasts make glucose from sunlight, and mitochondria convert glucose into usable ATP energy.',
      },
      {
        level: 'highschool',
        question: 'Why is the inner membrane of a mitochondrion deeply folded into cristae?',
        options: [
          'To store extra chlorophyll pigment',
          'To greatly increase surface area for the Electron Transport Chain and ATP synthase',
          'To block oxygen from entering the matrix',
          'To keep DNA outside the cell nucleus',
        ],
        correctIndex: 1,
        hint: 'More folded wall space = more room for ATP-making protein machines.',
        explanation: 'Cristae dramatically increase inner membrane surface area, packing many more ETC complexes and ATP synthase turbines per mitochondrion.',
      },
      {
        level: 'undergrad',
        question: 'Which feature of mitochondria strongly supports the Endosymbiotic Theory?',
        options: [
          'They have a single flat membrane and no DNA',
          'They possess double membranes, circular DNA, and bacterial-like 70S ribosomes',
          'They are synthesized from scratch inside the Golgi apparatus',
          'They perform photosynthesis in human muscle cells',
        ],
        correctIndex: 1,
        hint: 'What bacterial traits do mitochondria still carry?',
        explanation: 'Mitochondria retain circular DNA, 70S ribosomes, double membranes, and binary fission—hallmarks of ancient free-living α-proteobacteria.',
      },
    ],
    flashcards: [
      {
        front: 'Do plant cells have mitochondria even though they have chloroplasts?',
        back: 'YES! Chloroplasts make sugar using sunlight, while mitochondria break down sugar into ATP energy day and night.',
        mnemonic: 'Chloroplasts = Solar Kitchen; Mitochondria = Power Generator!',
      },
      {
        front: 'What are cristae and why do they matter?',
        back: 'Deep folds of the inner mitochondrial membrane that maximize surface area for oxidative phosphorylation (ATP synthesis).',
        mnemonic: 'Cristae creases create capacity for ATP!',
      },
      {
        front: 'Where does Glycolysis happen vs the Krebs Cycle?',
        back: 'Glycolysis happens in the cytoplasm; the Krebs Cycle happens inside the mitochondrial matrix.',
        mnemonic: 'Glycolysis = Outside (Cytoplasm); Krebs = Core (Matrix).',
      },
    ],
  },
];

/**
 * Generates an adaptive, structured learning package for ANY arbitrary topic the student searches!
 */
export function generateCustomTopic(rawQuery) {
  const cleanTitle = rawQuery.trim().replace(/\s+/g, ' ');
  const slug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const encoded = encodeURIComponent(cleanTitle);

  return {
    id: `custom-${slug}`,
    title: cleanTitle,
    subject: 'Custom Topic',
    difficulty: 'AI Adaptive',
    estimatedMinutes: 10,
    tags: ['Custom Search', 'AI Simplified', 'Adaptive Study'],
    isCustom: true,
    levels: {
      eli5: {
        headline: `Understanding "${cleanTitle}" using everyday intuition`,
        summary: `At its core, ${cleanTitle} is a way of explaining how smaller building blocks work together to produce a predictable result. Instead of memorizing intimidating definitions first, start by picturing what goes IN, what rule transforms it, and what comes OUT.`,
        steps: [
          {
            title: '1. Spot the core problem it solves',
            detail: `Every concept like ${cleanTitle} was invented to answer a specific "why" or "how" question in the real world.`,
          },
          {
            title: '2. Identify the 2–3 main actors',
            detail: `Break ${cleanTitle} into its main input, its core mechanism (the rule), and its final output.`,
          },
          {
            title: '3. Connect it to something familiar',
            detail: `Ask: "What everyday kitchen, traffic, or sports situation behaves just like ${cleanTitle}?"`,
          },
        ],
        analogy: `Think of ${cleanTitle} like learning the rules of a board game: learn the goal and one sample turn first—don't read the 40-page rulebook appendix before rolling the dice!`,
        formulaOrRule: `Core Mental Model: Input → Mechanism of ${cleanTitle} → Observable Outcome`,
        commonMistake: `Trying to memorize dense textbook sentences about ${cleanTitle} before being able to explain it in one plain sentence to a friend.`,
      },
      highschool: {
        headline: `Step-by-step intuition & structured breakdown of ${cleanTitle}`,
        summary: `${cleanTitle} combines foundational principles into a repeatable framework. Mastering it at the intermediate level means understanding cause-and-effect relationships, working through 2–3 concrete examples, and recognizing when the concept applies versus when it doesn't.`,
        steps: [
          {
            title: '1. Core Definition & Scope',
            detail: `Define ${cleanTitle} clearly and list the conditions required for it to hold true.`,
          },
          {
            title: '2. Cause-and-Effect Walkthrough',
            detail: `Trace a concrete numerical or real-world example step-by-step from start to finish.`,
          },
          {
            title: '3. Compare with Look-Alike Concepts',
            detail: `Write a quick "X vs Y" comparison so you never confuse ${cleanTitle} with neighboring topics on tests.`,
          },
          {
            title: '4. Active Recall Check',
            detail: `Close your notes and sketch a 4-box flowchart showing how ${cleanTitle} operates.`,
          },
        ],
        analogy: `Studying ${cleanTitle} without examples is like reading a swimming manual without touching water—one worked example unlocks ten pages of theory.`,
        formulaOrRule: `4-Step Mastery: Define → Trace Example → Contrast Edge Case → Teach Back`,
        commonMistake: `Passive re-reading! Switch immediately to solving a quick self-check question after reading the core mechanism.`,
      },
      undergrad: {
        headline: `Formal structure, mathematical/theoretical rigor & system role of ${cleanTitle}`,
        summary: `At the university level, ${cleanTitle} is analyzed through its underlying assumptions, formal notation, boundary conditions, and trade-offs. Focus on why the formal model works, how parameters govern its behavior, and how it connects to broader domain theory.`,
        steps: [
          {
            title: '1. Formal Assumptions & Axioms',
            detail: `Explicitly list what assumptions ${cleanTitle} relies on—and what breaks when an assumption is violated.`,
          },
          {
            title: '2. Formal Representation',
            detail: `Translate verbal intuition into precise notation, equations, diagrams, or pseudocode.`,
          },
          {
            title: '3. Quantitative / Complexity Trade-offs',
            detail: `Evaluate performance, accuracy, energy/time bounds, or sensitivity to key variables.`,
          },
        ],
        analogy: `Undergraduate mastery is opening the hood of the car: you no longer just drive ${cleanTitle}, you inspect how the engine parts interact under stress.`,
        formulaOrRule: `Tip: Connect your Gemini API Key in Settings for live AI-generated domain formulas for "${cleanTitle}"!`,
        commonMistake: `Applying formulas for ${cleanTitle} blindly without verifying boundary conditions or units.`,
      },
      deepdive: {
        headline: `Exam mastery, edge cases & synthesis for ${cleanTitle}`,
        summary: `Exam mastery of ${cleanTitle} means spotting tricky edge cases, deriving core results from first principles, and synthesizing ${cleanTitle} with adjacent topics under time pressure.`,
        steps: [
          {
            title: '1. First-Principles Derivation',
            detail: `Practice deriving the central result of ${cleanTitle} without peeking at a formula sheet.`,
          },
          {
            title: '2. Boundary & Degenerate Cases',
            detail: `Test extreme inputs (0, ∞, negative, noisy, or non-ideal conditions) to reveal hidden assumptions.`,
          },
          {
            title: '3. High-Yield Exam Traps',
            detail: `Identify the top 2 misconceptions professors test in multi-part questions on ${cleanTitle}.`,
          },
        ],
        analogy: `Exam mastery is stress-testing a bridge: you test the heaviest edge loads so nothing surprises you on exam day.`,
        formulaOrRule: `Pro Tip: Enable Live Gemini AI in Settings to unlock bespoke deep-dive derivations & custom quizzes for "${cleanTitle}".`,
        commonMistake: `Skipping boundary-case checks or forgetting to justify why a theorem's prerequisites are satisfied.`,
      },
    },
    conceptMap: {
      center: cleanTitle,
      nodes: [
        { label: 'Core Intuition', role: 'Start Here', detail: `Plain-language mental model for ${cleanTitle}.` },
        { label: 'Key Mechanism', role: 'How It Works', detail: 'Step-by-step cause-and-effect workflow.' },
        { label: 'Assumptions', role: 'Boundaries', detail: 'Conditions needed for the concept to hold.' },
        { label: 'Worked Example', role: 'Application', detail: 'Concrete case grounding abstract theory.' },
        { label: 'Exam Traps', role: 'Mastery', detail: 'Common pitfalls and tricky edge cases.' },
      ],
    },
    resources: [
      {
        title: `${cleanTitle} — Visual Explainer Videos`,
        type: 'Video',
        platform: 'YouTube Edu',
        duration: '12 min',
        level: 'eli5',
        url: `https://www.youtube.com/results?search_query=${encoded}+explained+visually+simple`,
        whyItFits: 'Curated visual-first video search tailored for beginner intuition.',
      },
      {
        title: `${cleanTitle} — Interactive Lessons & Practice`,
        type: 'Interactive',
        platform: 'Khan Academy',
        duration: '20 min',
        level: 'highschool',
        url: `https://www.khanacademy.org/search?page_search_query=${encoded}`,
        whyItFits: 'Structured step-by-step lessons with guided practice problems.',
      },
      {
        title: `${cleanTitle} — University Lecture Notes`,
        type: 'Reading Guide',
        platform: 'MIT OpenCourseWare',
        duration: '30 min',
        level: 'undergrad',
        url: `https://ocw.mit.edu/search/?q=${encoded}`,
        whyItFits: 'Formal undergraduate lecture notes and problem sets from MIT.',
      },
      {
        title: `${cleanTitle} — Reference & Deep Literature`,
        type: 'Practice',
        platform: 'Google Scholar',
        duration: '40 min',
        level: 'deepdive',
        url: `https://scholar.google.com/scholar?q=${encoded}`,
        whyItFits: 'Primary papers, surveys, and advanced academic references.',
      },
    ],
    quiz: [
      {
        level: 'eli5',
        question: `What is the BEST first step when learning a difficult concept like "${cleanTitle}"?`,
        options: [
          'Memorize the longest textbook paragraph word-for-word',
          'Build a plain-language mental model & analogy connecting input, mechanism, and outcome',
          'Skip directly to advanced proof problems without examples',
          'Highlight every single sentence in the chapter',
        ],
        correctIndex: 1,
        hint: 'How does EduBuddy recommend starting any tough topic?',
        explanation: 'Anchoring a new topic to a clear mental model and analogy builds durable understanding before layering formal notation.',
      },
      {
        level: 'undergrad',
        question: `How can you verify you have truly mastered "${cleanTitle}" before an exam?`,
        options: [
          'Re-read the notes three times while nodding along',
          'Explain it simply from memory (Feynman technique), test edge cases, and solve unseen problems',
          'Watch videos at 2x speed without taking notes',
          'Only memorize the final formula without its assumptions',
        ],
        correctIndex: 1,
        hint: 'Active recall + teaching back reveals hidden gaps instantly.',
        explanation: 'The Feynman Technique combined with edge-case testing exposes illusions of competence immediately.',
      },
    ],
    flashcards: [
      {
        front: `Feynman Check: Explain "${cleanTitle}" in 2 simple sentences without jargon.`,
        back: `State what problem ${cleanTitle} solves, the core rule driving it, and one real-world example where you see it in action.`,
        mnemonic: 'Problem → Mechanism → Real-World Example.',
      },
      {
        front: `When do textbook formulas or rules for "${cleanTitle}" break down?`,
        back: 'Whenever one of the core underlying assumptions or boundary conditions is violated—always check prerequisites first!',
        mnemonic: 'Check Assumptions Before Applying!',
      },
    ],
  };
}
