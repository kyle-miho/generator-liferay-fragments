const CustomGenerator = require('../../utils/custom-generator');
const fs = require('fs');
const glob = require('glob');
const path = require('path');
const voca = require('voca');

const {
  FRAGMENT_COLLECTION_SLUG_MESSAGE,
  FRAGMENT_COLLECTION_SLUG_VAR,
  FRAGMENT_DESCRIPTION_DEFAULT,
  FRAGMENT_DESCRIPTION_MESSAGE,
  FRAGMENT_DESCRIPTION_VAR,
  FRAGMENT_NAME_MESSAGE,
  FRAGMENT_NAME_VAR,
  FRAGMENT_TYPE_DEFAULT,
  FRAGMENT_TYPE_MESSAGE,
  FRAGMENT_TYPE_OPTIONS,
  FRAGMENT_TYPE_VAR,
  FRAGMENT_SLUG_VAR,
  NEW_COLLECTION_MESSAGE,
  NEW_COLLECTION_SHORT,
  NEW_COLLECTION_VALUE
} = require('../../utils/constants');

module.exports = class extends CustomGenerator {
  /**
   * @inheritdoc
   */
  async prompting() {
    await this._askFragmentData();
    await this._askCollection();
  }

  /**
   * @inheritdoc
   */
  writing() {
    if (this.getValue(FRAGMENT_COLLECTION_SLUG_VAR) === NEW_COLLECTION_VALUE) {
      this.composeWith(require.resolve('../collection'), {
        [FRAGMENT_NAME_VAR]: this.getValue(FRAGMENT_NAME_VAR),
        [FRAGMENT_DESCRIPTION_VAR]: this.getValue(FRAGMENT_DESCRIPTION_VAR)
      });
    } else {
      this.isRequired(FRAGMENT_COLLECTION_SLUG_VAR);
      this.isRequired(FRAGMENT_SLUG_VAR);

      const basePath = path.join(
        'src',
        this.getValue(FRAGMENT_COLLECTION_SLUG_VAR),
        this.getValue(FRAGMENT_SLUG_VAR)
      );

      this.copyTemplates(basePath, [
        'index.html',
        'main.js',
        'styles.css',
        'fragment.json'
      ]);
    }
  }

  /**
   * Request a collection for the created fragment.
   * Available options are fetched in _getCollectionChoices method.
   * @see _getCollectionChoices
   */
  async _askCollection() {
    await this.ask({
      type: 'list',
      name: FRAGMENT_COLLECTION_SLUG_VAR,
      message: FRAGMENT_COLLECTION_SLUG_MESSAGE,
      choices: this._getCollectionChoices(),
      when: !this.hasValue(FRAGMENT_COLLECTION_SLUG_VAR)
    });
  }

  /**
   * Requests fragment information and sets the fragment slug.
   */
  async _askFragmentData() {
    await this.ask([
      {
        type: 'input',
        name: FRAGMENT_NAME_VAR,
        message: FRAGMENT_NAME_MESSAGE,
        when: !this.hasValue(FRAGMENT_NAME_VAR)
      },
      {
        type: 'input',
        name: FRAGMENT_DESCRIPTION_VAR,
        message: FRAGMENT_DESCRIPTION_MESSAGE,
        when: !this.hasValue(FRAGMENT_DESCRIPTION_VAR)
      },
      {
        type: 'list',
        name: FRAGMENT_TYPE_VAR,
        message: FRAGMENT_TYPE_MESSAGE,
        choices: FRAGMENT_TYPE_OPTIONS,
        default: this.getValue(FRAGMENT_TYPE_DEFAULT),
        when: !this.hasValue(FRAGMENT_TYPE_VAR)
      }
    ]);

    this.setValue(FRAGMENT_DESCRIPTION_VAR, FRAGMENT_DESCRIPTION_DEFAULT);

    this.setValue(
      FRAGMENT_SLUG_VAR,
      voca.slugify(this.getValue(FRAGMENT_NAME_VAR))
    );

    this.setValue(FRAGMENT_TYPE_VAR, FRAGMENT_TYPE_DEFAULT);
  }

  /**
   * Read the list of created collections from the project structure
   * and returns a list of choices. It also adds an extra 'new collection'
   * option for adding new collections.
   * @return {Array<{name:string, value: string, short: string}>} List of
   *  choices parseable by yeoman's ask method.
   */
  _getCollectionChoices() {
    let choices = [];

    try {
      choices = glob
        .sync(`${this.destinationRoot()}/src/*/collection.json`)
        .map(collectionJSON => {
          const collectionName = JSON.parse(
            fs.readFileSync(collectionJSON, 'utf-8')
          ).name;

          const collectionSlug = path.basename(
            path.resolve(`${collectionJSON}/..`)
          );

          return {
            name: collectionName,
            value: collectionSlug,
            short: `(${collectionSlug})`
          };
        });
    } catch (error) {}

    choices.push({
      name: NEW_COLLECTION_MESSAGE,
      value: NEW_COLLECTION_VALUE,
      short: NEW_COLLECTION_SHORT
    });

    return choices;
  }
};
