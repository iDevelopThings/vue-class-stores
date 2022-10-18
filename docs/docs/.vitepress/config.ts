import {SiteData} from "vitepress";
import {DefaultTheme} from "vitepress/theme";


type ThemeConfig = DefaultTheme.Config & {}

const config: Partial<SiteData<ThemeConfig>> = {
    title: 'Vue Class Stores',
    description: 'Powerful class based stores for vue 3',
    themeConfig: {
        siteTitle: 'Vue Class Stores',
        editLink: {
            pattern: 'https://github.com/idevelopthings/vue-class-stores/edit/main/docs/docs/:path'
        },
        nav: [
            {text: 'Github', link: 'https://github.com/idevelopthings/vue-class-stores'}
        ],
        sidebar: [
            {
                text: 'Guide',
                collapsible: true,
                collapsed: false,
                items: [
                    {text: 'Getting Started', link: '/guide/'},
                    {text: 'Creating your first store', link: '/guide/your-first-store'},
                ]
            },
            {
                text: 'Core Concepts',
                collapsible: true,
                collapsed: false,
                items: [
                    {
                        text: 'State',
                        link: '/core-concepts/state',
                        collapsible: true,
                        collapsed: true,
                        items: [
                            {text: 'Acessing the state', link: '/core-concepts/state#accessing-the-state'},
                            {text: 'Resetting the state', link: '/core-concepts/state#resetting-the-state'},
                            {text: 'Mutating the state', link: '/core-concepts/state#mutating-the-state'},
                            {text: 'Watching for changes', link: '/core-concepts/state#watching-for-changes'},
                        ]
                    },
                    {
                        text: 'Getters',
                        link: '/core-concepts/getters',
                        collapsible: true,
                        collapsed: true,
                        items: [
                            {text: 'Defining a getter', link: '/core-concepts/getters#defining-a-getter'},
                            {text: 'Computed getters', link: '/core-concepts/getters#computed-getters'},
                        ]
                    },
                    {
                        text: 'Actions',
                        link: '/core-concepts/actions',
                        collapsible: true,
                        collapsed: true,
                        items: [
                            {text: 'Defining an action', link: '/core-concepts/actions#defining-an-action'},
                            {text: 'Subscribing to actions', link: '/core-concepts/actions#subscribing-to-actions'},
                        ]
                    },
                    {
                        text: 'Extensions',
                        link: '/core-concepts/extending-stores',
                        items: [
                            {
                                text: 'Defining an extension',
                                link: '/core-concepts/extending-stores#defining-an-extension'
                            },
                        ]
                    },
                ]
            },
            {
                text: 'Life Cycle',
                collapsible: true,
                collapsed: false,
                items: [
                    {
                        text: 'Overview',
                        link: '/life-cycle/overview',
                    },
                    {
                        text: 'Hooks',
                        link: '/life-cycle/hooks',
                    },
                ]
            },
            {
                text: 'Configuration',
                link: '/config/stores',
                items: [
                    {text: 'Stores', link: '/config/stores'},
                ]
            },
        ]
    }
};

export default config;
