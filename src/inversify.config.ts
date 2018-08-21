import CLI from '@/core/CLI';
import Factory from '@/core/Factory';
import JsGenerator from '@/core/generators/JsGenerator';
import TsGenerator from '@/core/generators/TsGenerator';
import IdentifierUtils from '@/core/libs/IdentifierUtils';
import JsDocUtils from '@/core/libs/JsDocUtils';
import JsonSchemaUtils from '@/core/libs/JsonSchemaUtils';
import OasDocument from '@/core/libs/OasDocument';
import ParameterUtils from '@/core/libs/ParameterUtils';
import PrettierUtils from '@/core/libs/PrettierUtils';
import Tapable from '@/core/libs/Tapable';
import DefinitionFragment from '@/core/oas-fragments/DefinitionFragment';
import OperationFragment from '@/core/oas-fragments/OperationFragment';
import OperationRequestFragment from '@/core/oas-fragments/OperationRequestFragment';
import OperationResponseFragment from '@/core/oas-fragments/OperationResponseFragment';
import DefinitionVisitor from '@/core/oas-visitors/DefinitionVisitor';
import OperationVisitor from '@/core/oas-visitors/OperationVisitor';
import { DocumentType } from '@/core/OasFragment';
import * as identifier from '@/identifier';
import FileSystem from '@/util/FileSystem';
import Network from '@/util/Network';
import Queue from '@/util/Queue';
import Timer from '@/util/Timer';
import { Container, decorate, injectable } from 'inversify';
import { AST } from 'json-schema-to-typescript/dist/src/types/AST';
import { Oas20CompositeVisitor, OasLibraryUtils } from 'oai-ts-core';
import { HookMap } from 'tapable';
import EnhanceTypeNamePlugin from './core/plugins/EnhanceTypeNamePlugin';
import FixRefPlugin from './core/plugins/FixRefPlugin';

const container = new Container({
  skipBaseClassChecks: true,
});

decorate(injectable(), Map);

// libs
container.bind<Tapable>(identifier.Tapable).to(Tapable);
container.bind<PrettierUtils>(identifier.PrettierUtils).toConstantValue(new PrettierUtils());
container.bind<IdentifierUtils>(identifier.IdentifierUtils).toConstantValue(new IdentifierUtils());
container.bind<JsonSchemaUtils>(identifier.JsonSchemaUtils).toConstantValue(new JsonSchemaUtils());
container.bind<OasLibraryUtils>(identifier.OasLibraryUtils).toConstantValue(new OasLibraryUtils());
container.bind<JsDocUtils>(identifier.JsDocUtils).to(JsDocUtils); // @inject used in JsDocUtils
container.bind<ParameterUtils>(identifier.ParameterUtils).toConstantValue(new ParameterUtils());

// core
container.bind<CLI>(identifier.CLI).to(CLI);
container.bind<Factory>(identifier.Factory).to(Factory);
container.bind<OasDocument>(identifier.OasDocument).to(OasDocument);

// fragments
container.bind<DefinitionFragment>(identifier.DefinitionFragment).to(DefinitionFragment);
container.bind<OperationFragment>(identifier.OperationFragment).to(OperationFragment);
container.bind<OperationRequestFragment>(identifier.OperationRequestFragment).to(OperationRequestFragment);
container.bind<OperationResponseFragment>(identifier.OperationResponseFragment).to(OperationResponseFragment);

// oas visitors
container.bind<Oas20CompositeVisitor>(identifier.Oas20CompositeVisitor).to(Oas20CompositeVisitor);
container.bind<OperationVisitor>(identifier.OperationVisitor).to(OperationVisitor);
container.bind<DefinitionVisitor>(identifier.DefinitionVisitor).to(DefinitionVisitor);

// generators
container.bind<TsGenerator>(identifier.TsGenerator).to(TsGenerator);
container.bind<JsGenerator>(identifier.JsGenerator).to(JsGenerator);

// built-in plugins
container.bind<EnhanceTypeNamePlugin>(identifier.EnhanceTypeNamePlugin).to(EnhanceTypeNamePlugin);
container.bind<FixRefPlugin>(identifier.FixRefPlugin).to(FixRefPlugin);

// maps
container.bind<Map<string, HookMap>>(identifier.HookMap).to(Map);
container.bind<Map<string, DocumentType>>(identifier.OasFragmentMap).to(Map);

// queues
container.bind<Queue<AST>>(identifier.AstQueue).to(Queue);

// utils
container.bind<Timer>(identifier.Timer).to(Timer);
container.bind<Network>(identifier.Network).to(Network);
container.bind<FileSystem>(identifier.FileSystem).to(FileSystem);

export default container;
