package graphql

// This file will not be regenerated automatically.
//
// It serves as dependency injection for your app, add any dependencies you require
// here.

import (
	"presets/internal/graphql/loaders"
	"presets/internal/limits"
	presetsmodel "presets/internal/model"
)

// Store — полный контракт, который резолверам нужен от хранилища: то же самое, что просят
// лоадеры (loaders.Store — List/GetMany, встроен), плюс запись/удаление, нужные только мутациям.
// Интерфейс, а не конкретный *store.Store, — та же причина, что у loaders.Store: подмена на
// считающую обёртку в тесте (TestBatchingCollapsesToConstantCalls, resolver_test.go).
type Store interface {
	loaders.Store
	Create(input presetsmodel.Input) (*presetsmodel.Record, error)
	Replace(id string, input presetsmodel.Input) (*presetsmodel.Record, error)
	Remove(id string) (bool, error)
}

// Resolver держит открытое хранилище и пределы — резолверы читают/пишут через тот же store, что
// раньше REST (bbolt-byte-invariant, ROADMAP.yaml), и проверяют конверт по тем же пределам, что
// раньше проверял REST-конверт (limits — на envelope.go/normalizeInput).
type Resolver struct {
	store  Store
	limits limits.Limits
}

// New заводит резолвер поверх уже открытого хранилища.
func New(s Store, lim limits.Limits) *Resolver {
	return &Resolver{store: s, limits: lim}
}
