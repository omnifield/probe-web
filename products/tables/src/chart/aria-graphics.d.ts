// Расширение типов JSX под роли МОДУЛЯ ГРАФИКИ (WAI-ARIA Graphics Module 1.0).
//
// Зачем это нужно. Роли `graphics-document` / `graphics-object` / `graphics-symbol`
// нормированы отдельным документом W3C, а перечень ролей в типах Solid собран по ядру
// WAI-ARIA — там их нет. Обойти это приведением типа значило бы спрятать нормированный
// атрибут за `as never`; вместо этого пользуемся точкой расширения, которую Solid для того и
// объявил: `JSX.ExplicitAttributes` включает имена, доступные через `attr:`.
//
// Это НЕ разрешение писать любой атрибут: расширение точечное и названо здесь вместе с
// причиной, а сами роли берутся из нормы, а не выдумываются.

import "solid-js";

declare module "solid-js" {
  namespace JSX {
    interface ExplicitAttributes {
      role: string;
    }
  }
}
