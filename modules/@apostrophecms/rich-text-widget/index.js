// Implements rich text editor widgets. Unlike most widget types, the rich text
// editor does not use a modal; instead you edit in context on the page.

const sanitizeHtml = require('sanitize-html');

module.exports = {
  extend: '@apostrophecms/widget-type',
  options: {
    icon: 'format-text-icon',
    label: 'Rich Text',
    contextual: true,
    defaultData: { content: '' },
    className: false,
    minimumDefaultOptions: {
      toolbar: [
        'styles',
        'bold',
        'italic',
        'strike',
        'link',
        'bullet_list',
        'ordered_list',
        'blockquote'
      ],
      styles: [
        // you may also use a `class` property with these
        {
          tag: 'p',
          label: 'Paragraph (P)'
        },
        {
          tag: 'h2',
          label: 'Heading 2 (H2)'
        },
        {
          tag: 'h3',
          label: 'Heading 3 (H3)'
        },
        {
          tag: 'h4',
          label: 'Heading 4 (H4)'
        }
      ]
    },
    defaultOptions: {},
    components: {
      widgetEditor: 'AposRichTextWidgetEditor',
      widget: 'AposRichTextWidget'
    },
    editorTools: {
      styles: {
        component: 'AposTiptapStyles',
        label: 'Styles'
      },
      '|': { component: 'AposTiptapDivider' },
      bold: {
        component: 'AposTiptapButton',
        label: 'Bold',
        icon: 'format-bold-icon',
        command: 'toggleBold'
      },
      italic: {
        component: 'AposTiptapButton',
        label: 'Italic',
        icon: 'format-italic-icon',
        command: 'toggleItalic'
      },
      underline: {
        component: 'AposTiptapButton',
        label: 'Underline',
        icon: 'format-underline-icon',
        command: 'toggleUnderline'
      },
      horizontalRule: {
        component: 'AposTiptapButton',
        label: 'Horizontal Rule',
        icon: 'minus-icon',
        command: 'setHorizontalRule'
      },
      link: {
        component: 'AposTiptapLink',
        label: 'Link',
        icon: 'link-icon'
      },
      bulletList: {
        component: 'AposTiptapButton',
        label: 'Bulleted List',
        icon: 'format-list-bulleted-icon',
        command: 'toggleBulletList'
      },
      orderedList: {
        component: 'AposTiptapButton',
        label: 'Ordered List',
        icon: 'format-list-numbered-icon',
        command: 'toggleOrderedList'
      },
      strike: {
        component: 'AposTiptapButton',
        label: 'Strike',
        icon: 'format-strikethrough-variant-icon',
        command: 'toggleStrike'
      },
      blockquote: {
        component: 'AposTiptapButton',
        label: 'Blockquote',
        icon: 'format-quote-close-icon',
        command: 'toggleBlockquote'
      },
      codeBlock: {
        component: 'AposTiptapButton',
        label: 'Code Block',
        icon: 'code-tags-icon',
        command: 'toggleCode'
      },
      undo: {
        component: 'AposTiptapButton',
        label: 'Undo',
        icon: 'undo-icon'
      },
      redo: {
        component: 'AposTiptapButton',
        label: 'Redo',
        icon: 'redo-icon'
      },
      // Disabled until sanitize-html is auto configured to save style properties
      // when align controls are present
      // alignLeft: {
      //   component: 'AposTiptapButton',
      //   label: 'Align Left',
      //   icon: 'format-align-left-icon',
      //   command: 'setTextAlign',
      //   commandParameters: 'left',
      //   isActive: { textAlign: 'left' }
      // },
      // alignCenter: {
      //   component: 'AposTiptapButton',
      //   label: 'Align Center',
      //   icon: 'format-align-center-icon',
      //   command: 'setTextAlign',
      //   commandParameters: 'center',
      //   isActive: { textAlign: 'center' }
      // },
      // alignRight: {
      //   component: 'AposTiptapButton',
      //   label: 'Align Right',
      //   icon: 'format-align-right-icon',
      //   command: 'setTextAlign',
      //   commandParameters: 'right',
      //   isActive: { textAlign: 'right' }
      // },
      // alignJustify: {
      //   component: 'AposTiptapButton',
      //   label: 'Align Justify',
      //   icon: 'format-align-justify-icon',
      //   command: 'setTextAlign',
      //   commandParameters: 'justify',
      //   isActive: { textAlign: 'justify' }
      // },
      highlight: {
        component: 'AposTiptapButton',
        label: 'Mark',
        icon: 'format-color-highlight-icon',
        command: 'toggleHighlight'
      }
    },
    // Additional properties used in executing tiptap commands
    // Will be mixed in automatically for developers
    tiptapTextCommands: {
      setNode: [ 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre' ],
      toggleMark: [
        'b', 'strong', 'code', 'mark', 'em', 'i',
        'a', 's', 'del', 'strike', 'span', 'u'
      ],
      wrapIn: [ 'blockquote' ]
    },
    tiptapTypes: {
      heading: [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ],
      paragraph: [ 'p' ],
      textStyle: [ 'span' ],
      code: [ 'code' ],
      bold: [ 'strong', 'b' ],
      strike: [ 's', 'del', 'strike' ],
      italic: [ 'i', 'em' ],
      highlight: [ 'mark' ],
      link: [ 'a' ],
      underline: [ 'u' ],
      codeBlock: [ 'pre' ],
      blockquote: [ 'blockquote' ]
    }
  },
  beforeSuperClass(self) {
    self.options.defaultOptions = {
      ...self.options.minimumDefaultOptions,
      ...self.options.defaultOptions
    };
  },
  icons: {
    'format-text-icon': 'FormatText',
    'format-color-highlight-icon': 'FormatColorHighlight'
  },
  methods(self) {
    return {
      // Return just the rich text of the widget, which may be undefined or null if it has not yet been edited

      getRichText(widget) {
        return widget.content;
      },

      async load(req, widgets) {
      },

      // Convert area rich text options into a valid sanitize-html
      // configuration, so that h4 can be legal in one area and illegal in
      // another.

      optionsToSanitizeHtml(options) {
        return {
          ...sanitizeHtml.defaultOptions,
          allowedTags: self.toolbarToAllowedTags(options),
          allowedAttributes: self.toolbarToAllowedAttributes(options),
          allowedClasses: self.toolbarToAllowedClasses(options),
          allowedStyles: self.toolbarToAllowedStyles(options)
        };
      },

      toolbarToAllowedTags(options) {
        const allowedTags = {
          br: true,
          p: true
        };
        const simple = {
          bold: [
            'b',
            'strong'
          ],
          italic: [
            'i',
            'em'
          ],
          strike: [ 's' ],
          link: [ 'a' ],
          horizontal_rule: [ 'hr' ],
          bullet_list: [
            'ul',
            'li'
          ],
          ordered_list: [
            'ol',
            'li'
          ],
          blockquote: [ 'blockquote' ],
          code_block: [
            'pre',
            'code'
          ]
        };
        for (const item of options.toolbar || []) {
          if (simple[item]) {
            for (const tag of simple[item]) {
              allowedTags[tag] = true;
            }
          } else if (item === 'styles') {
            for (const style of options.styles || []) {
              const tag = style.tag;
              allowedTags[tag] = true;
            }
          }
        }
        return Object.keys(allowedTags);
      },

      toolbarToAllowedAttributes(options) {
        const allowedAttributes = {};
        const simple = {
          link: {
            tag: 'a',
            attributes: [
              'href',
              'id',
              'name',
              'target'
            ]
          },
          alignLeft: {
            tag: '*',
            attributes: [ 'style' ]
          },
          alignCenter: {
            tag: '*',
            attributes: [ 'style' ]
          },
          alignRight: {
            tag: '*',
            attributes: [ 'style' ]
          },
          alignJustify: {
            tag: '*',
            attributes: [ 'style' ]
          }
        };
        for (const item of options.toolbar || []) {
          if (simple[item]) {
            for (const attribute of simple[item].attributes) {
              allowedAttributes[simple[item].tag] = allowedAttributes[simple[item].tag] || [];
              allowedAttributes[simple[item].tag].push(attribute);
              allowedAttributes[simple[item].tag] = [ ...new Set(allowedAttributes[simple[item].tag]) ];
            }
          }
        }
        return allowedAttributes;
      },

      toolbarToAllowedStyles(options) {
        const allowedStyles = {};
        const simple = {
          alignLeft: {
            selector: '*',
            properties: {
              'text-align': [ /^left$/ ]
            }
          },
          alignCenter: {
            selector: '*',
            properties: {
              'text-align': [ /^center$/ ]
            }
          },
          alignRight: {
            selector: '*',
            properties: {
              'text-align': [ /^right$/ ]
            }
          },
          alignJustify: {
            selector: '*',
            properties: {
              'text-align': [ /^justify$/ ]
            }
          }
        };
        for (const item of options.toolbar || []) {
          if (simple[item]) {
            if (!allowedStyles[simple[item].selector]) {
              allowedStyles[simple[item].selector] = {};
            }
            for (const property in simple[item].properties) {
              if (!allowedStyles[simple[item].selector][property]) {
                allowedStyles[simple[item].selector][property] = [];
              }
              allowedStyles[simple[item].selector][property].push(...simple[item].properties[property]);
            }
          }
        }
      },

      toolbarToAllowedClasses(options) {
        const allowedClasses = {};
        if ((options.toolbar || []).includes('styles')) {
          for (const style of options.styles || []) {
            const tag = style.tag;
            const classes = self.getStyleClasses(style);
            allowedClasses[tag] = allowedClasses[tag] || {};
            for (const c of classes) {
              allowedClasses[tag][c] = true;
            }
          }
        }
        for (const tag of Object.keys(allowedClasses)) {
          allowedClasses[tag] = Object.keys(allowedClasses[tag]);
        }
        return allowedClasses;
      },

      getStyleClasses(heading) {
        if (!heading.class) {
          return [];
        }
        return heading.class.split(/\s+/);
      },

      addSearchTexts(item, texts) {
        texts.push({
          weight: 10,
          text: self.apos.util.htmlToPlaintext(item.content),
          silent: false
        });
      },

      isEmpty(widget) {
        const text = self.apos.util.htmlToPlaintext(widget.content || '');
        return !text.trim().length;
      }
    };
  },
  extendMethods(self) {
    return {
      async sanitize(_super, req, input, saniOptions) {
        const rteOptions = {
          ...self.options.defaultOptions,
          ...saniOptions
        };

        const output = await _super(req, input, rteOptions);
        output.content = sanitizeHtml(input.content, self.optionsToSanitizeHtml(rteOptions));
        return output;
      },
      // Add on the core default options to use, if needed.
      getBrowserData(_super, req) {
        const initialData = _super(req);

        const finalData = {
          ...initialData,
          components: self.options.components,
          tools: self.options.editorTools,
          defaultOptions: self.options.defaultOptions,
          tiptapTextCommands: self.options.tiptapTextCommands,
          tiptapTypes: self.options.tiptapTypes
        };
        return finalData;
      }
    };
  }
};
