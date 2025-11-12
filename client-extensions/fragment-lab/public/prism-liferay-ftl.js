(function (Prism) {
    // 1. Safety wrapper to wait for Prism
    if (!Prism) {
      if (window.console) {
        console.warn("Prism.js not found, Liferay FTL language not created.");
      }
      return;
    }
    // Wait for 'markup' language to be loaded, as we depend on it
    if (!Prism.languages.markup) {
      Prism.hooks.add('complete', function(env) {
        if (env.language === 'markup' && !Prism.languages['liferay-ftl']) {
          defineLiferayFtl(Prism);
        }
      });
    } else {
      defineLiferayFtl(Prism);
    }
  
    /**
     * Defines the 'liferay-ftl' language.
     */
    function defineLiferayFtl(Prism) {
      // Check if already defined
      if (Prism.languages['liferay-ftl']) {
        return;
      }
  
      // --- 1. Define the core FTL expression logic ---
      // (This allows matching nested strings, parens, etc. inside a tag)
      let LFR_FTL_EXPR =
        /[^\[\]"']|\((?:<expr>)*\)|\[(?!#--)|\[#--(?:[^-]|-(?!->))*--\]|"(?:[^\\"]|\\.)*"|'(?:[^\\']|\\.)*'/
          .source;
      for (let i = 0; i < 2; i++) {
        LFR_FTL_EXPR = LFR_FTL_EXPR.replace(/<expr>/g, () => LFR_FTL_EXPR);
      }
      LFR_FTL_EXPR = LFR_FTL_EXPR.replace(/<expr>/g, /[^\s\S]/.source);
  
      // --- 2. Define the core grammar for *inside* the tags ---
      // (This is what highlights strings, operators, numbers, etc.)
      const ftl_grammar = {
        'string': [
          { pattern: /\br("|')(?:(?!\1)[^\\]|\\.)*\1/, greedy: true },
          {
            pattern: RegExp(
              /("|')(?:(?!\1|\$\{)[^\\]|\\.|\$\{(?:(?!\})(?:<expr>))*\})*\1/.source.replace(
                /<expr>/g,
                () => LFR_FTL_EXPR
              )
            ),
            greedy: true,
            inside: {
              'interpolation': {
                pattern: RegExp(
                  /((?:^|[^\\])(?:\\\\)*)\$\{(?:(?!\})(?:<expr>))*\}/.source.replace(
                    /<expr>/g,
                    () => LFR_FTL_EXPR
                  )
                ),
                lookbehind: true,
                inside: {
                  'interpolation-punctuation': { pattern: /^\$\{|\}$/, alias: 'punctuation' },
                  $rest: null,
                },
              },
            },
          }
        ],
        'keyword': /\b(?:as)\b/,
        'boolean': /\b(?:false|true)\b/,
        'builtin-function': { pattern: /((?:^|[^?])\?\s*)\w+/, lookbehind: true, alias: 'function' },
        'function': /\b\w+(?=\s*\()/,
        'number': /\b\d+(?:\.\d+)?\b/,
        'operator': /\.\.[<*!]?|->|--|\+\+|&&|\|\||\?{1,2}|[-+*/%!=<>]=?|\b(?:gt|gte|lt|lte)\b/,
        'punctuation': /[,;.:()[\]{}]/,
      };
      ftl_grammar.string[1].inside.interpolation.inside.$rest = ftl_grammar;
  
  
      // --- 3. Define the Liferay FTL tokens to be injected ---
      const liferayFtlTokens = {
        'liferay-comment': {
          pattern: /\[#--[\s\S]*?--\]/,
          greedy: true,
          alias: 'comment',
        },
        'liferay-directive': {
          pattern: RegExp(
            // This is the outer pattern that finds the whole tag
            /\[\/?[#@][a-zA-Z_][\w]*(?:<expr>)*?\]/.source.replace(/<expr>/g, () => LFR_FTL_EXPR),
            'i'
          ),
          greedy: true,
          inside: {
            // This finds the tag name, e.g., "[#if"
            'directive': {
              pattern: /(^\[\/?)[#@][a-z_]\w*/i,
              lookbehind: true,
              alias: 'keyword',
            },
            // This finds the brackets
            'punctuation': /^\[\/?|\]$/,
            // This uses the core grammar to highlight the rest
            'content': {
              pattern: /.*/,
              alias: 'ftl',
              inside: ftl_grammar,
            },
          },
        },
        'ftl-interpolation': {
          pattern: RegExp(
            // This finds ${...}
            /\$\{(?:<expr>)*?\}/.source.replace(/<expr>/g, () => LFR_FTL_EXPR),
            'i'
          ),
          greedy: true,
          inside: {
            'punctuation': /^\$\{|\}$/,
            'content': {
              pattern: /.*/,
              alias: 'ftl',
              inside: ftl_grammar,
            },
          },
        },
      };
  
      // --- 4. THIS IS THE FIX ---
      // Create our new language by *cloning* the 'markup' language
      Prism.languages['liferay-ftl'] = Prism.languages.extend('markup', {});
  
      // --- 5. INJECT OUR RULES ---
      // Insert our FTL tokens *before* the 'tag' token.
      // This ensures our [#if] is matched as a 'liferay-directive'
      // before it can be misidentified as a 'tag'.
      Prism.languages.insertBefore('liferay-ftl', 'tag', liferayFtlTokens);
  
      // --- 6. ALIAS ---
      // Alias 'ftl' to our new language for good measure.
      Prism.languages.ftl = Prism.languages['liferay-ftl'];
    }
  
  })(window.Prism);

  