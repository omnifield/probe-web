import { gql } from "@web-core/query/graphql";

export const LIST_QUERY = gql`
  query ListPresets($kind: String, $component: [String!]) {
    presets(kind: $kind, component: $component) {
      id
      label
      name
      kind
      savedAt
      ... on Palette {
        author
        scales
        dimensions
        light
        dark
      }
      ... on Form {
        component
        recipe
        keyframes
        variantTags
        author
      }
      ... on Outfit {
        palette {
          name
        }
        forms {
          name
        }
        tags {
          name
        }
        overrides
        author
      }
      ... on Content {
        component
        data
        author
      }
      ... on Assembly {
        component
        assembly
        author
      }
      ... on Tag {
        tagLabel
        author
      }
    }
  }
`;

export const CREATE_MUTATION = gql`
  mutation CreatePreset($input: PresetInput!) {
    createPreset(input: $input) {
      id
      label
      name
      kind
      savedAt
    }
  }
`;

export const REPLACE_MUTATION = gql`
  mutation ReplacePreset($id: ID!, $input: PresetInput!) {
    replacePreset(id: $id, input: $input) {
      id
      label
      name
      kind
      savedAt
    }
  }
`;

export const DELETE_MUTATION = gql`
  mutation DeletePreset($id: ID!) {
    deletePreset(id: $id)
  }
`;
