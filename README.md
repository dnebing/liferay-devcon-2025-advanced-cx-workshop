# liferay-devcon-2025-advanced-cx-workshop

So this is the Liferay Workspace for the Liferay Devcon 2025 workshop on Advanced Client Extension Techniques.

It is pretty much ready to go, just do the following:

```
$ blade gw initBundle
$ blade server start
```

After that, point your browser at http://localhost:8080 and sign in using the credentials:

* User: `devcon-admin@liferay-devcon.com`
* Password: `learn-devcon`

With that, you'll be ready for the workshop!

This workspace uses Liferay DXP 2025 Q1.18 and includes a developer license good through the end of 2025.

## Fragments

Through the course of the workshop, you'll be creating a number of eye-catching components to use in Liferay.

Don't worry, the hard part (creating the Front End Client Extension) is already done. If interested, check out client-extensions/devcon-elements.

All of the elements are implemented using Lit, but the important part is that they are _*Standard Web Components*_. Once you have a _Standard Web Component_, it's pretty
easy to wrap a Liferay Client Extension around it to use it in a Liferay environment.

### Lottie CTA

The Lottie Call To Action component shows of a Lottie Player element that is built around leveraging in Liferay.

Why: Crisp, lightweight vector animations for buttons/hero banners; easy timeline control & events.  ￼
Fragment knobs: animation src, loop, hover-play, speed; FM sets CTA text/URL, per-role alternate animation; i18n for labels/tooltips.

